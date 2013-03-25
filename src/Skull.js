(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'Backbone', 'jquery', 'exports'], function(_, Backbone, $, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Skull.
            root.Skull = factory(root, exports, _, Backbone, $);
        });
    } else {
        // Browser globals
        root.Skull = factory(root, {}, root._, root.Backbone, (root.jQuery || root.Zepto));
  }
}(this, function (root, Skull, _, $) {
    'use strict';

    /**
     * @author <a href="mailto:doctor.hogart@gmail.com">Konstantin Kitmanov</a>
     * May be freely distributed under the MIT license.
     */

    // conflict management
    var previousSkull = root.Skull;

    Skull.noConflict = function () {
        root.Chitin = previousSkull;
        return this;
    };


    // Utility classes

    /**
     * @class ResourceRegistry
     * Simple implementation of Registry pattern
     * @constructor
     */
    var ResourceRegistry = Skull.ResourceRegistry = function () {
        /** @private */
        this._storage = {};

        /** @private */
        this._fabric = {};
    };

    ResourceRegistry.prototype = {
        /**
         * Registers object or fabric by given <code>key<code>
         * @param {String} key
         * @param {Object} value
         * @param {Object} options
         * @return {Object}
         */
        register: function (key, value, options) {
            if (arguments.length == 3) {
                return this._fabric[key] = [value, options]
            } else {
                return this._storage[key] = value;
            }
        },

        /**
         * Deletes from registry
         * @param key
         * @param isFabric
         */
        unregister: function (key, isFabric) {
            if (isFabric) {
                delete this._fabric[key]
            }
            else {
                delete this._storage[key];
            }
        },

        /**
         * Returns requested object from registry
         * @param key
         * @param options
         * @returns {*}
         */
        acquire: function (key, options) {
            if (arguments.length == 2) {
                if (this._fabric[key]) {
                    var fabric = this._fabric[key],
                        create = fabric[0],
                        params = _.extend({}, fabric[1], options);

                    return create(params)
                } else {
                    return this._storage[key] || options;
                }
            } else {
                return this._storage[key]
            }
        }
    };

    /**
     * Iterates over context.$$registry, acquiring dependencies from it via context.registry.acquire
     * @type {Function}
     */
    var processRegistry = Skull.processRegistry = function (context) {
        var items = _.result(context, '$$registry'),
            registry = context.registry,
            requirement;

        if (items) {
            for (var key in items) {
                requirement = _.isArray(items[key]) ? items[key] : [items[key]];
                this[key] = registry.acquire.apply(registry, requirement);
            }
        }
    };


    /**
     * Backbone.sync OO-style
     * Can emit auhorized requests, when provided with getToken function and authHeaderName
     */
    var Syncer = Skull.Syncer = function (options) {
        this.initialize(options);
    };

    Syncer.prototype = {

        // Map from CRUD to HTTP for our default syncer implementation.
        methodMap: {
            'create': 'POST',
            'update': 'PUT',
            'delete': 'DELETE',
            'read':   'GET',
            'patch': 'PATCH'
        },

        urlError: function () {
            throw new Error('A "url" property or function must be specified');
        },

        initialize: function (options) {
            this.getToken = options.getToken;
            this.authHeaderName = options.authHeaderName;

            this.emulateHTTP = options.emulateHTTP || false;
            this.emulateJSON = options.emulateJSON || false;
        },

        sync: function(method, model, options) {
            var type = this.methodMap[method];

            // Default options, unless specified.
            _.defaults(options || (options = {}), {
                emulateHTTP: Backbone.emulateHTTP,
                emulateJSON: Backbone.emulateJSON
            });

            // Default JSON-request options.
            var params = {type: type, dataType: 'json'};

            // Ensure that we have a URL.
            if (!options.url) {
                params.url = _.result(model, 'url') || this.urlError();
            }

            // Ensure that we have the appropriate request data.
            if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
                params.contentType = 'application/json';
                params.data = JSON.stringify(options.attrs || model.toJSON(options));
            }

            // For older servers, emulate JSON by encoding the request into an HTML-form.
            if (options.emulateJSON) {
                params.contentType = 'application/x-www-form-urlencoded';
                params.data = params.data ? {model: params.data} : {};
            }

            // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
            // And an `X-HTTP-Method-Override` header.
            if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
                params.type = 'POST';
                if (options.emulateJSON) params.data._method = type;
                var beforeSend = options.beforeSend;
                options.beforeSend = function(xhr) {
                    xhr.setRequestHeader('X-HTTP-Method-Override', type);
                    if (beforeSend) return beforeSend.apply(this, arguments);
                };
            }

            // Don't process data on a non-GET request.
            if (params.type !== 'GET' && !options.emulateJSON) {
                params.processData = false;
            }

            params = this.authorize(params);

            var success = options.success;
            options.success = function(resp, status, xhr) {
                if (success) success(resp, status, xhr);
                model.trigger('sync', model, resp, options);
            };

            var error = options.error;
            options.error = function(xhr, status, thrown) {
                if (error) error(model, xhr, options);
            };

            // Make the request, allowing the user to override any Ajax options.
            var xhr = this.ajax(_.extend(params, options));
            model.trigger('request', model, xhr, options);
            return xhr;
        },

        // Add authorization headers (if possible)
        authorize: function (params) {
            if (this.getToken && this.getToken() && this.authHeaderName) {
                params.headers[this.authHeaderName] = this.getToken();
            }

            return params;
        },

        ajax: function () {
            return $.ajax.apply($, arguments);
        }
    };

    /**
     * @class Model
     */
    var Model = Skull.Model = Backbone.Model.extend({
        $$registry: {
            syncer: 'syncer'
        },

        constructor: function (attributes, options) {
            this.registry = options.registry;
            processRegistry(this);

            Model.__super__.constructor.call(this, attributes, options);
        },

        /**
         * Almost the same as .set method, but always do it's work silently (i.e. not firing any event).
         * Useful when setting values from UI to prevent «event loop».
         * Note that silentSet doesn't accept (key, value, options) arguments.
         * @param {Object|String} key Either key or properties hash
         * @param {Object} val Either value or options
         * @param {Object} [options={}] Additional options
         */
        silentSet: function (key, val, options) {
            var attrs;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (_.isObject(key)) {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            (options || (options = {})).silent = true;
            return this.set(attrs, options);
        },

        clone: function () {
            return new this.constructor(this.attributes, {registry: this.registry});
        },

        /**
         * Wraps any persistent operations so they trigger 'syncStart' and 'syncEnd' events every time.
         * Useful for triggering show/hide preloaders in UI and so on
         * @return {jQuery.Deferred}
         */
        sync: function (method, model, options) {
            this.trigger('syncStart');
            this.inSync = true;

            var success = options.success,
                error = options.error,
                always = options.always;

            options.success = _.bind(function (model, resp) {
                this.inSync = false;
                this.isFetched = true;

                if (success) {
                    success(model, resp);
                }
                if (always) {
                    always(this);
                }

                this.trigger('syncEnd', true);
            }, this);

            options.error = _.bind(function (model, xhr, options) {
                this.inSync = false;
                this.isFetched = true;

                if (error) {
                    error(this, xhr)
                }
                if (always) {
                    always(this);
                }

                this.trigger('syncEnd', false);
            }, this);

            return this.syncer.sync(method, model, options);
        },

        /**
         * toTemplate is reserved for generating data for rendering,
         * e.g. for computed values and so on. Feel free to override
         * @returns {Object}
         */
        toTemplate: function () {
            var tplData = _.clone(this.attributes);

            return tplData;
        }
    });

    var Collection = Skull.Collection.extend({
        $$registry: {
            syncer: 'syncer'
        },

        constructor: function (models, options) {
            this.registry = options.registry;
            processRegistry(this);

            Collection.__super__.constructor.call(this, models, options);
        },

        /**
         * Delegates sync operations to this.syncer
         * @return {jQuery.Deferred}
         */
        sync: function (method, model, options) {
            return this.syncer.sync(method, model, options);
        },

         /**
          * Wraps any persistent operations so they trigger 'syncStart' and 'syncEnd' events every time.
          * Useful for triggering show/hide preloaders in UI and so on
          * @param options
          * @returns {jQuery.Deferred}
          */
        fetch: function (options) {
            this.inSync = true;
            this.trigger('syncStart');

            options = options ? _.clone(options) : {};

            var success = options.success;
            options.success = _.bind(function(resp, status, xhr) {
                this.inSync = false;
                this.isFetched = true;

                this[options.add ? 'add' : 'reset'](this.parse(resp), options);
                if (success) success(this, resp);

                this.trigger('syncEnd', true);
            }, options.scope || this);

            var error = options.error;
            options.error = _.bind(function(model, response) {
                this.inSync = false;
                this.isFetched = true;

                if (error) {
                    error(this, response, options);
                }

                this.trigger('syncEnd', false);
            }, options.scope || this);

            return this.sync('read', this, options);
        },

         /**
          * @see Model#toTemplate
          * @returns {Object[]}
          */
        toTemplate: function () {
            return _.invoke(this.models, 'toTemplate')
        },

        _prepareModel: function (attrs, options) {
            (options || (options = {})).registry = this.registry;

            Collection.__super__._prepareModel.call(this, attrs, options);
        }

    });

    var View = Skull.View = Backbone.View.extend({
        $$registry: {
            templater: 'templater'
        },

        // Whether this.$el will be overriden on rendering
        replaceEl: false,

        constructor: function (options) {
            this.registry = options.registry;
            processRegistry(this);

            View.__super__.constructor.call(this, options);
        },

        initialize: function (options) {
            // semi-automated child views management. Should be instance property.
            this.children = {};
        },

        /**
         * Shortcut for rendering this.tpl to this.$el (or instead of this element)
         * @param {Skull.Model|Skull.Collection|Object} [tplData={}] if this parameter have .toTemplate method,
         * it would be called and result will be passed instead
         * @param {Boolean} [replace=false] whether replace whole $el or only replace it's .html()
         */
        rr: function (tplData, replace) {
            // work out parameters
            var data = {},
                replaceEl = false;
            if (arguments.length == 2) {
                data = tplData;
                replaceEl = replace;
            } else if (arguments.length == 1) {
                if (_.isBoolean(arguments[0])) {
                    replaceEl = arguments[0]
                } else {
                    data = arguments[0]
                }
            }


            // get data
            if (data && 'toTemplate' in data && _.isFunction(data.toTemplate)) {
                data = data.toTemplate();
            }

            // get template
            var tpl = _.result(this, 'tpl');

            if (!tpl) {
                throw new Error('"tpl" property not found while attaching view "' + this.cid + '" to "' + this.$el.selector + '"');
            }

            // rendering at last
            var rendered = this.templater.tmpl(tpl, data);

            if (replaceEl) {
                var $rendered = $(rendered);
                this.$el.replaceWith($rendered);
                this.setElement($rendered);
            } else {
                this.$el.html(rendered);
            }
        },

        /**
         * Default rendering procedure: renders this.collection or this.model or {}.
         * Feel free to override if needed.
         * @return data passed to template
         */
        render: function () {
            var uiState = this.collection || this.model || {};

            this.rr(uiState, this.replaceEl ? this.$el : undefined);
            this.onRender();

            return uiState;
        },

        /**
         * Performs declarative bindings: subViews, events.
         * Call this method when html is ready.
         */
        onRender: function () {
            this._ensureUI();

            this._ensureSubviews();

            this.delegateEvents();
        },

        _ensureUI: function (ui) {
            ui || (ui = _.result(this, '$$ui'));

            if (!ui) {
                return; // nothing to do here anymore
            }

            this.ui = {};

            _.each(ui, function (selector, name) {
                this.ui[name] = this.$(selector);
            }, this);
        },

        _ensureSubviews: function (subViews, options) {
            subViews || (subViews = _.result(this, '$$subViews'));

            if (!subViews) {
                return; // nothing to do here anymore
            }

            var renderView = function (viewClass, selector) {
                this._renderView(viewClass, selector, options);
            };

            _.each(subViews, renderView, this)
        },

        _renderView: function (viewClass, selector, options) {
            var params = {
                el: selector
            };

            this.model && (params.model = this.model);
            this.collection && (params.collection = this.collection);

            params.viewName = selector;
            if (options) {
                params = _.extend({}, params, options);
            }

            if (_.isArray(viewClass) && viewClass.length > 1) {
                params.viewName = viewClass[1].viewName ? viewClass[1].viewName : params.viewName;
            }

            this.registerChild(params.viewName, viewClass, params);
        },

        /**
         * Registers nested view
         * @param {String|Boolean} viewName
         * @param {View} viewClass
         * @param {Object} options
         * @return {View}
         */
        registerChild: function (viewName, viewClass, options) {
            var params = _.extend(
                {
                    parent: this,
                    registry: this.registry
                },
                options
            );

            if (_.isArray(viewClass)) {
                if (viewClass.length > 1) {
                    if (_.isFunction(viewClass[1])) {
                        params = _.extend(viewClass[1].call(this), params);
                    } else if (_.isString(viewClass[1])) {
                        if (!(viewClass[1] in this)) {
                            throw new TypeError('Method "' + viewClass[1] + '" does not exist');
                        }
                        params = _.extend(this[viewClass[1]].call(this), params);
                    } else {
                        params = _.extend(viewClass[1], params);
                    }

                }
                viewClass = viewClass[0];
            }

            if (_.isString(params.el)) {
                params.el = this.$(params.el);
            }

            if (!viewClass) {
                throw 'Invalid class when registering child: ' + viewName;
            }

            var child = new viewClass(params);
            if (!viewName) {
                viewName = child.cid;
                child.viewName = viewName;
            } else {
                child.cid = viewName;
            }

            this.children[viewName] = child;

            return child;
        },

        /**
         * Carefully removes nested view
         * @param {String} viewName
         */
        unregisterChild: function (viewName) {
            if (!this.children[viewName]) {
                return;
            }

            this.children[viewName].remove();
            delete this.children[viewName];
        },

        _unregisterChildren: function () {
            _.each(this.children, function (child, childName) {
                this.unregisterChild(childName);
            }, this);
        },

        onBeforeRemove: function () {
            this._unregisterChildren();

            this.undelegateEvents();
            this.$el.off();

            this.off();
            this.stopListening();
        },

        /**
         * @destructor
         */
        remove: function () {
            this.onBeforeRemove();
            View.__super__.remove.call(this);
        }
    });

    return Skull
}));