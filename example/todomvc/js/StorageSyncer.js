// Most code is courtesy of https://github.com/jeromegn/Backbone.localStorage
// rewritten to suit Skull.Syncer style

(function (root, factory) {
    'use strict';
    var depNames = ['Skull', 'underscore', 'jquery'];

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(depNames, factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(depNames.map(function (depName) { return require(depName); }));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.Skull, root._, root.$);
    }
}(this, function (Skull, _, $) {
    'use strict';

    // A simple module to replace `Backbone.sync` with *localStorage*-based
    // persistence. Models are given GUIDS, and saved into a JSON object. Simple
    // as that.

    var StorageSyncer = Skull.Syncer.extend({
        initialize: function (options) {
            StorageSyncer.__super__.initialize.apply(this, arguments);

            this.name = options.name;
            this.serializer = options.serializer || {
                serialize: function (item) {
                    return _.isObject(item) ? JSON.stringify(item) : item;
                },

                // fix for 'illegal access' error on Android when JSON.parse is passed null
                deserialize: function (data) {
                    return data && JSON.parse(data);
                }
            };

            var store = this.localStorage().getItem(this.name);
            this.records = (store && store.split(',')) || [];
        },

        sync: function (method, model, options) {
            var resp;
            var errorMessage;
            var syncDfd = $.Deferred();

            try {
                switch (method) {
                    case 'read':
                        resp = model.id === undefined ? this.findAll() : this.find(model);
                        break;
                    case 'create':
                        resp = this.create(model);
                        break;
                    case 'update':
                        resp = this.update(model);
                        break;
                    case 'delete':
                        resp = this.destroy(model);
                        break;
                }

            } catch (error) {
                if (error.code === 22 && this._storageSize() === 0) {
                    errorMessage = 'Private browsing is unsupported';
                } else {
                    errorMessage = error.message;
                }
            }

            if (resp) {
                if (options && options.success) {
                    options.success(resp);
                }

                if (syncDfd) {
                    syncDfd.resolve(resp);
                }

            } else {
                errorMessage = errorMessage || 'Record Not Found';

                if (options && options.error) {
                    options.error(errorMessage);
                }

                if (syncDfd) {
                    syncDfd.reject(errorMessage);
                }
            }

            // add compatibility with $.ajax
            // always execute callback for success and error
            if (options && options.complete) {
                options.complete(resp);
            }

            return syncDfd && syncDfd.promise();
        },

        /**
         * Save the current state of the **Store** to *localStorage*.
         */
        save: function () {
            this.localStorage().setItem(this.name, this.records.join(','));
        },

        /**
         * Add a model, giving it a (hopefully)-unique GUID, if it doesn't already have an id of it's own.
         * @param model
         * @return {boolean}
         */
        create: function (model) {
            if (!model.id) {
                model.id = StorageSyncer.guid();
                model.set(model.idAttribute, model.id);
            }
            this.localStorage().setItem(
                this._itemName(model.id),
                this.serializer.serialize(model)
            );
            this.records.push(model.id.toString());
            this.save();
            return this.find(model) !== false;
        },

        /**
         * Update a model by replacing its copy in `this.data`.
         * @param model
         * @return {boolean}
         */
        update: function (model) {
            this.localStorage().setItem(
                this._itemName(model.id),
                this.serializer.serialize(model)
            );

            var modelId = model.id.toString();

            if (!_.contains(this.records, modelId)) {
                this.records.push(modelId);
                this.save();
            }

            return this.find(model) !== false;
        },

        /**
         * Retrieve a model from `this.data` by id.
         * @param model
         * @return {Object}
         */
        find: function (model) {
            return this.serializer.deserialize(
                this.localStorage().getItem(this._itemName(model.id))
            );
        },

        /**
         * Return the array of all models currently in storage.
         * @return {Array}
         */
        findAll: function () {
            var result = [];

            for (var i = 0, id, data; i < this.records.length; i++) {
                id = this.records[i];
                data = this.serializer.deserialize(
                    this.localStorage().getItem(this._itemName(id))
                );
                if (data !== null) {
                    result.push(data);
                }
            }

            return result;
        },

        /**
         * Delete a model from `this.data`, returning it.
         * @param {Skull.Model} model
         * @return {Skull.Model}
         */
        destroy: function (model) {
            this.localStorage().removeItem(this._itemName(model.id));

            var modelId = model.id.toString();

            for (var i = 0; i < this.records.length; i++) {
                if (this.records[i] === modelId) {
                    this.records.splice(i, 1);
                }
            }

            this.save();

            return model;
        },

        localStorage: function () {
            return localStorage;
        },

        /**
         * Clear localStorage for specific collection.
         * @private
         */
        _clear: function () {
            var local = this.localStorage(),
                itemRe = new RegExp('^' + this.name + '-');

            // Remove id-tracking item (e.g., 'foo').
            local.removeItem(this.name);

            // Match all data items (e.g., 'foo-ID') and remove.
            _.each(local, function (key) {
                if (itemRe.test(key)) {
                    local.removeItem(key);
                }
            });

            this.records.length = 0;
        },

        /**
         * Size of localStorage.
         * @return {Number}
         * @private
         */
        _storageSize: function () {
            return this.localStorage().length;
        },

        /**
         * @param id
         * @return {String}
         * @private
         */
        _itemName: function (id) {
            return this.name + '-' + id;
        }

    }, {
        /**
         * Create a new instance of StorageSyncer. Useful when using as fabric function in ResourceRegistry
         * @param options
         */
        instantiate: function (options) {
            return new this (options);
        },

        /**
         * Generate four random hex digits.
         * @return {String}
         */
        s4: function () {
            // jshint -W016
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            // jshint +W016
        },

        /**
         * Generate a pseudo-GUID by concatenating random hexadecimal.
         * @return {String}
         */
        guid: function () {
            var s4 = this.s4;
            return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
        }
    });

    return StorageSyncer;
}));