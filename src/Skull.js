(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'backbone', 'jquery', 'exports'], function(_, Backbone, $, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Skull.
            root.Skull = factory(root, exports, _, Backbone, $);
        });
    } else {
        // Browser globals
        root.Skull = factory(root, {}, root._, root.Backbone, (root.jQuery || root.Zepto));
  }
}(this, function (root, Skull, _, Backbone, $) {
    'use strict';

    /**
     * @author <a href="mailto:doctor.hogart@gmail.com">Konstantin Kitmanov</a>
     * May be freely distributed under the MIT license.
     */

    // conflict management
    var previousSkull = root.Skull;

    Skull.noConflict = function () {
        root.Skull = previousSkull;
        return this;
    };


    // Utility classes

    /**
     * Abstract class that can be extended in Backbone way.
     * @class Skull.Abstract
     */
    var Abstract = Skull.Abstract = function () {
        this.initialize.apply(this, arguments);
    };

    Abstract.prototype = {
        initialize: function () {}
    };

    Abstract.extend = Backbone.Model.extend;

    /**
     * Class for creating object which can listen and trigger events.
     * Useful when creating buses and so on.
     * @class Skull.Observable
     * @extends Skull.Abstract
     */
    var Observable = Skull.Observable = Abstract.extend(Backbone.Events);

    /**
     * Simple implementation of Registry pattern
     * @class Skull.ResourceRegistry
     * @extends Skull.Abstract
     * @constructor
     */
    var ResourceRegistry = Skull.ResourceRegistry = Skull.Abstract.extend(/** @lends Skull.ResourceRegistry.prototype */{
        initialize: function () {
            /** @private */
            this._storage = {};

            /** @private */
            this._fabric = {};
        },

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
                    return this._storage[key];
                }
            } else {
                return this._storage[key];
            }
        }
    });

    /**
     * Iterates over context.__registry__, acquiring dependencies from it via context.registry.acquire
     * @type {Function}
     */
    var processRegistry = Skull.processRegistry = function (context) {
        var items = _.result(context, '__registry__'),
            registry = context.registry,
            requirement;

        if (items) {
            for (var key in items) {
                requirement = _.isArray(items[key]) ? items[key] : [items[key]];
                context[key] = registry.acquire.apply(registry, requirement);
            }
        }
    };

    /**
     * Detects host and protocol for your API from `<script data-api-domain="http://my.api.example.com"/>`
     * @param {String} [attributeName='data-api-domain'] Definitive attribute name
     * @type {Function}
     */
    var detectDomain = Skull.detectDomain = function (attributeName) {
        attributeName = attributeName || 'data-api-domain';

        var script = $('script[' + attributeName + ']');

        if (!script.length) {
            return {}
        }

        var path = script.attr(attributeName) || '',
            pathParts = path.split('//');

        if (pathParts.length === 2) {
            return {
                host: pathParts[1],
                protocol: pathParts[0].substring(0, pathParts[0].length - 1)
            }
        } else {
            return {
                host: path
            }
        }
    };

    /**
     * A tool to combine domains, ports, protocols, API endpoints with versions ans subtypes into URL.
     * Any URL consists of following parts: <protocol>://<domain>/<prefix>/<type>/<version>/
     * None of this parts are required, but you should understand that setting protocol without domain
     * will result in relative URL from current domain root: /restEndpoint/clients/1.0.0/
     * Note that skipping protocol and adding domain will lead to inheriting protocol from current document:
     * //my.api.example.com/restEndpoint/clients/1.0.0/. This is completely valid URL.
     * @class Skull.UrlProvider
     */
    var UrlProvider = Skull.UrlProvider = Abstract.extend(/** @lends Skull.UrlProvider.prototype */{
        defaults: {
            version: '',
            type: '',
            host: '',
            protocol: '',
            port: false,
            prefix: ''
        },

        initialize: function (options) {
            this.params = {};
            this.set(options)
        },

        /**
         * Updates inner state of URL pieces
         * @param {Object} options
         */
        set: function (options) {
            this.cachedPath = this.cachedUrl = false; // drop cache
            this.params = _.extend({}, this.defaults, options);
        },

        /**
         * Get absolute URL, with domain and protocol if provided.
         * @returns {String}
         */
        getApiUrl: function () {
            if (!this.cachedPath) {
                var parts = [];

                if (this.params.host) {
                    parts.push('//');
                    if (this.params.protocol) {
                        parts.unshift(this.params.protocol + ':');
                    }
                    parts.push(this.params.host);

                    if (this.params.port) {
                        parts.push(':' + this.params.port)
                    }
                }

                this.cachedPath = parts.join('') + this.getApiPath();
            }

            return this.cachedPath;
        },

        /**
         * Returns relative URL form root of domain.
         * @returns {String}
         */
        getApiPath: function () {
            if (!this.cachedUrl) {
                var parts = _.compact([this.params.prefix, this.params.type, this.params.version]);
                this.cachedUrl = '/' + parts.join('/') + '/';
            }

            return this.cachedUrl;
        }
    });

    /**
     * Backbone.sync OOP-style
     * Can emit auhorized requests, when provided with getToken function via registry
     */
    var Syncer = Skull.Syncer = Skull.Abstract.extend(/** @lends Skull.Syncer.prototype */{
        __registry__: {
            getToken: 'getToken'
        },

        /**
         * Map from CRUD to HTTP for our default syncer implementation.
         * @protected
         */
        _methodMap: {
            'create': 'POST',
            'update': 'PUT',
            'delete': 'DELETE',
            'read':   'GET',
            'patch': 'PATCH'
        },

        defaults: {
            authHeaderName: 'Authorization',
            emulateHTTP: false,
            emulateJSON: false
        },

        /**
         * @protected
         */
        _urlError: function () {
            throw new Error('A "url" property or function must be specified');
        },

        /**
         * @constructs
         * @param {Object} options
         * @param {Boolean} [options.emulateHTTP=false] emulate HTTP 1.1 methods for old servers
         * @param {Boolean} [options.emulateJSON=false] emulate JSON by encoding the request into an HTML-form
         * @param {String} [options.authHeaderName='Authorization'] emulate JSON by encoding the request into an HTML-form
         * @param {Skull.ResourceRegistry} options.registry registry instance
         */
        initialize: function (options) {
            this.registry = options.registry;
            processRegistry(this);

            this.params = _.extend({}, this.defaults, options);
        },

        /**
         * Pretty much the same as Backbone.sync, only allows to extend requests with authorization headers
         * @param {String} method
         * @param {Backbone.Model|Backbone.Collection} model
         * @param {Object} [options={}] Allows to override any request param
         * @returns {jQuery.Deferred}
         */
        sync: function(method, model, options) {
            var type = this._methodMap[method];

            // Default options, unless specified.
            _.defaults(options || (options = {}), _.pick(this.params, 'emulateHTTP', 'emulateJSON'));

            // Default JSON-request options.
            var params = {type: type, dataType: 'json'};

            // Ensure that we have a URL.
            if (!options.url) {
                params.url = _.result(model, 'url') || this._urlError();
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

            params = this._authorize(params);

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

        /**
         * Augments request params with authorization header. Feel free to override.
         * @param {Object} params
         * @returns {Object} augmented request params
         * @protected
         */
        _authorize: function (params) {
            var token = this.getToken ? this.getToken() : false,
                headerName = this.params.authHeaderName;

            if (token && headerName) {
                if (!params.headers) {
                    params.headers = {}
                }
                params.headers[headerName] = token;
            }

            return params;
        },

        /**
         * Performs ajax request
         * @returns {jQuery.Deferred}
         */
        ajax: function () {
            return $.ajax.apply($, arguments);
        }
    });

    /**
     * Skull.Template provides wrapper for template engine (_.template by default).
     * This wrapper performs caching, error handling, bit of debugging info.
     * By default Skull.Template fetches templates stored in `script` tags with 'js-tpl-<templateName>' class.
     * @class Skull.Template
     */
    var Template = Skull.Template = Abstract.extend(/** @lends Skull.Template.prototype */{
        defaults: {
            selectorPrefix: 'script.js-tpl-',
            trim: true,
            debug: false,
            dontCache: false
        },

        tplFunction: _.template,

        /**
         * @param {Object} options
         * @param {String} [options.selectorPrefix='script.js-tpl-'] default selector for finding template nodes
         * @param {Boolean} [options.trim=true] trim whitespaces from template before compiling
         * @param {Boolean} [options.debug=false] provide debugging info in rendered templates and to console
         * @param {Boolean} [options.dontCache=false] Useful when developing, you can change template right on page without reloading it
         * @param {Function} [options.tplFunction=_.template] Template function must accept template string and return compiled to function template
         */
        initialize: function (options) {
            /**
             * Holds all compiled templates.
             * Instance property.
             * @private
             */
            this._templates = {};

            this.params = _.extend({}, this.defaults, options);

            if (options && options.tplFunction) {
                this.tplFunction = options.tplFunction
            }
        },

        /**
         * Fetches template by name.
         * @param {String} name
         * @returns {jQuery}
         * @protected
         * @throws {Error} 'No such template'
         */
        _getTemplateNode: function (name) {
            var fullSelector = this.params.selectorPrefix + name,
                node = $(fullSelector);

            if (!node.length) {
                throw new Error('No such template: "' + name + '". Make sure you have "' + fullSelector + '" node on your page')
            } else if (node.length > 1) {
                node = node.eq(0);

                if (this.params.debug) {
                    console.warn('Too many template nodes: ' + fullSelector);
                }
            }

            return node;
        },

        /**
         * Primary templates processing – e.g. whitespace trimming
         * @param {jQuery} node
         * @returns {String}
         * @protected
         */
        _preprocessTemplate: function (node) {
            var rawTemplate = node.text();

            if (this.params.trim) {
                rawTemplate = $.trim(rawTemplate)
            }

            return rawTemplate
        },

        /**
         * Compiles template to function
         * @param {String} rawTemplate
         * @returns {Function}
         * @protected
         */
        _compileTemplate: function (rawTemplate) {
            return this.tplFunction(rawTemplate);
        },

        /**
         * Gets compiled template by its name
         * @param {String} name
         * @returns {Function}
         * @protected
         */
        _getCompiledTemplate: function (name) {
            var node = this._getTemplateNode(name),
                processed = this._preprocessTemplate(node),
                compiled = this._compileTemplate(processed);

            return compiled;
        },

        /**
         * Returns either cached compiled template or compiles it, caches and returns it
         * @param {String} name template name
         * @returns {Function} compiled template
         * @protected
         */
        _getTemplate: function (name) {
            if (this._templates[name] && !this.params.dontCache) {
                return this._templates[name];
            } else {
                var tpl = this._getCompiledTemplate(name);
                this._templates[name] = tpl;
                return tpl;
            }
        },

        /**
         * This normally should be only one Template method you call from other places.
         * When provided with truthie second argument, returns rendered templates, otherwise, compiled.
         * When provided with third argument, calls it with passing, again, rendered or compiled template.
         * @param {String} name
         * @param {Object} [tplData=null] if passed, function returns rendered template. If not, compiled template.
         * @param {Function} [callback=null] if defined, will be called instead of returning result.
         * @return {Function|String|undefined}
         */
        tmpl: function (name, tplData, callback) {
            var tpl = this._getTemplate(name);

            if (arguments.length > 1 && tplData) { // should return already rendered template

                // specify context information, e.g. l10n string, common application data…
                this.params.context && (tplData.__context__ = this.params.context);

                tpl = tpl(tplData);

                if (this.params.debug) {
                    // surround with debugging comment so we can see where template starts and ends
                    tpl = '<!-- tpl:' + name + ' -->\n' + tpl + '\n<!-- /tpl:' + name + ' -->';
                }
            }

            // can be used with async rendering
            if (callback) {
                callback(tpl);
            } else {
                return tpl;
            }
        }
    });

    /**
     * Skull.Model is basic model with few enhancements:
     * registry handling, `silentSet` method and `syncStart` and `syncEnd` events
     * @class Skull.Model
     * @extends Backbone.Model
     */
    var Model = Skull.Model = Backbone.Model.extend(/** @lends Skull.Model.prototype */{
        __registry__: {
            syncer: 'syncer'
        },

        /**
         * Whether model is syncing right now.
         * @type Boolean
         */
        inSync: false,

        /**
         * Whether model was fetched form the server
         * @type Boolean
         */
        isFetched: false,

        /** @constructs */
        constructor: function (attributes, options) {
            this.registry = options.registry;
            processRegistry(this);

            Model.__super__.constructor.call(this, attributes, options);

            // more readable cid
            this.cid = _.uniqueId('model');
        },

        /**
         * Almost the same as .set method, but always do it's work silently (i.e. not firing any event).
         * Useful when setting values from UI to prevent «event loop».
         * @param {Object|String} key Either key or properties hash
         * @param {Object} [val] Either value or options
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

        /**
         * Overridden for registry handling
         * @returns {Skull.Model}
         */
        clone: function () {
            return new this.constructor(this.attributes, {registry: this.registry});
        },

        /**
         * Wraps any persistent operations so they trigger 'syncStart' and 'syncEnd' events every time.
         * Useful for triggering show/hide preloaders in UI and so on.
         * @param {String} method 'create', 'read', 'update', 'delete' or 'patch'
         * @param {Skull.Model} model Link to this
         * @param {Object} [options={}]
         * @return {jQuery.Deferred}
         */
        sync: function (method, model, options) {
            this.trigger('syncStart');
            this.inSync = true;

            options || (options = {});

            var success = options.success,
                error = options.error,
                always = options.always;

            options.success = _.bind(function (response) {
                this.inSync = false;
                this.isFetched = true;

                if (success) {
                    success(this, response, options);
                }
                if (always) {
                    always(this, response, options);
                }

                this.trigger('syncEnd', true);
            }, this);

            options.error = _.bind(function (response) {
                this.inSync = false;
                this.isFetched = true;

                if (error) {
                    error(this, response, options)
                }
                if (always) {
                    always(this, response, options);
                }

                this.trigger('syncEnd', false);
            }, this);

            return this.syncer.sync(method, model, options);
        },

        /**
         * toTemplate is reserved for generating data for rendering,
         * e.g. for computed values and so on. Feel free to override.
         * @returns {Object}
         */
        toTemplate: function () {
            var tplData = _.clone(this.attributes);

            return tplData;
        }
    });

    /**
     * Skull.RestModel is Model more suitable for REST, with reasonable defaults
     * @class Skull.RestModel
     * @extends Skull.Model
     */
    var RestModel = Skull.RestModel = Model.extend(/** @lends Skull.RestModel.prototype */{
        __registry__: {
            syncer: 'syncer',
            getApiUrl: 'getApiUrl'
        },

        url: function () {
            var url = this.getApiUrl() + this.resource + '/';

            if (this.id) {
                url += encodeURIComponent(this.id) + '/';
            }

            return url;
        },

        /** @constructs */
        constructor: function (attributes, options) {
            RestModel.__super__.constructor.call(this, attributes, options);

            // make sure we have resource
            if (!this.resource) {
                throw new Error('Missing "resource" field');
            }

            // generate more readable cid
            this.cid = _.uniqueId('model.' + this.resource);
        }
    });

    /**
     * Skull.Collection is basic model with few enhancements:
     * registry handling, syncStart and syncEnd events
     * @class Skull.Collection
     * @extends Backbone.Collection
     */
    var Collection = Skull.Collection = Backbone.Collection.extend(/** @lends Skull.Collection.prototype */{
        __registry__: {
            syncer: 'syncer'
        },

        model: Model,

        /** @constructs */
        constructor: function (models, options) {
            this.registry = options.registry;
            processRegistry(this);

            Collection.__super__.constructor.call(this, models, options);

            this.cid = _.uniqueId('collection');
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

            var success = options.success,
                error = options.error,
                always = options.always;

            options.success = _.bind(function(response) {
                this.inSync = false;
                this.isFetched = true;

                this[options.add ? 'add' : 'reset'](this.parse(response), options);

                if (success) {
                    success(this, response, options);
                }

                if (always) {
                    always(this, response, options);
                }

                this.trigger('syncEnd', true);
            }, this);

            options.error = _.bind(function(response) {
                this.inSync = false;
                this.isFetched = true;

                if (error) {
                    error(this, response, options);
                }

                if (always) {
                    always(this, response, options);
                }

                this.trigger('syncEnd', false);
            }, this);

            return this.sync('read', this, options);
        },

         /**
          * Provides data for templates.
          * {@link Skull.Model#toTemplate}
          * @returns {Object[]}
          */
        toTemplate: function () {
            return _.invoke(this.models, 'toTemplate')
        },

        /**
         * Prepare a hash of attributes (or other model) to be added to this collection.
         * Takes care of registry passing.
         * @param {Object} attrs future model attrs
         * @param {Object} [options={}]
         * @private
         */
        _prepareModel: function (attrs, options) {
            (options || (options = {})).registry = this.registry;

            return Collection.__super__._prepareModel.call(this, attrs, options);
        },

        /**
         * Returns a new instance of the collection with an identical list of models.
         * Takes care of registry passing.
         * @returns {Skull.Collection}
         */
        clone: function () {
            return new this.constructor(this.models, {registry: this.registry});
        }
    });

    /**
     * Skull.RestCollection is Collection more suitable for REST, with reasonable defaults
     * @class Skull.RestCollection
     * @extends Skull.Collection
     */
    var RestCollection = Skull.RestCollection = Collection.extend(/** @lends Skull.RestCollection.prototype */{
        __registry__: {
            syncer: 'syncer',
            getApiUrl: 'getApiUrl'
        },

        model: RestModel,

        url: function () {
            var url = this.getApiUrl();
            url += this.resource + '/';

            return url;
        },

        /** @constructs */
        constructor: function (models, options) {
            // make sure we have resource
            if (!this.model.prototype.resource) {
                throw new Error('Missing "resource" field');
            } else {
                this.resource = this.model.prototype.resource;
            }

            RestCollection.__super__.constructor.call(this, models, options);

            this.cid = _.uniqueId('collection.' + this.resource);
        }
    });

    /**
     * Fused with automagic, Skull.View is highly configurable tool for creating and manipulating your app's views.
     * Core differences with vanilla Backbone.View is following:
     * # Full-cycle nested views automated managing, {@link Skull.View#__children__}
     * # Handy access to often used nodes inside view, {@link Skull.View#__ui__}
     * # Preventing memory leaks and "zombie" callbacks with more thorough {@link Skull.View#remove} method
     * @class {Skull.View}
     */
    var View = Skull.View = Backbone.View.extend(/** @lends Skull.View.prototype */{
        __registry__: {
            template: 'template'
        },

        // Whether this.$el will be completely replaced on rendering
        replaceEl: false,

        /**
         * Automatically (and not, if you wish) creates and renders nested views.
         * Actually is a hash. Each field can take 4 forms:
         * # '.js-someSelector': MyViewClass
         * # '.js-anotherSelector': [MyViewClass, {answer: 42}] // second element will be passed to MyViewClass constructor
         * # '.js-yetAnotherSelector': [MyViewClass, 'someMethodName'] // this['someMethodName'] will be called in proper context (`this`),
         *   and result will be passed to MyViewClass constructor
         * # '.js-selectorToo': [MyViewClass, function () { return {answer: 42} }] // second element will be called in proper context,
         *   and result will be passed to MyViewClass constructor
         *
         * All mentioned views will be placed to `this.children` hash for further managing during {@link Skull.View#onRender}.
         *
         * @type {Object}
         */
        __children__: null,

        /**
         * Automatically (and not, if you wish) creates links to nodes inside your view. This is useful (and handy),
         * when you change some node's attributes several times during view's lifecycle.
         * Actually is a config in following form:
         * somePrettyName: '.some .selector'
         *
         * All defined bits will be placed to `this.ui` hash for further managing during {@link Skull.View#onRender}.
         */
        __ui__: null,

        constructor: function (options) {
            this.registry = options.registry;
            processRegistry(this);

            View.__super__.constructor.call(this, options);

            // more readable cid
            this.cid = _.uniqueId('view');
        },

        initialize: function (options) {
            View.__super__.initialize.call(this.options);

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
            var rendered = this.template.tmpl(tpl, data);

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

            // if we haven't yet $el, then we should replace element either way
            this.rr(uiState, this.replaceEl ? this.$el : undefined);
            this.onRender();

            return uiState;
        },

        /**
         * Performs declarative bindings: __children__, __ui__, events
         * Call this method when html is ready.
         */
        onRender: function () {
            this._ensureUI();

            this._ensureSubviews();

            this.delegateEvents();
        },

        _ensureUI: function (ui) {
            ui || (ui = _.result(this, '__ui__'));

            if (!ui) {
                return; // nothing to do here anymore
            }

            this.ui = {};

            _.each(ui, function (selector, name) {
                this.ui[name] = this.$(selector);
            }, this);
        },

        _ensureSubviews: function (children, options) {
            children || (children = _.result(this, '__children__'));

            if (!children) {
                return; // nothing to do here anymore
            }

            var renderView = function (viewClass, selector) {
                this._renderView(viewClass, selector, options);
            };

            _.each(children, renderView, this)
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

        /**
         * Carefully removes *all* nested views
         * @private
         */
        _unregisterChildren: function () {
            _.each(this.children, function (child, childName) {
                this.unregisterChild(childName);
            }, this);
        },

        /**
         * Cleans up: removes nested views, shuts down events both DOM and Backbone's
         */
        onBeforeRemove: function () {
            this._unregisterChildren();

            this.undelegateEvents();
            this.$el.off();

            this.off();
        },

        /**
         * @destructor
         */
        remove: function () {
            this.onBeforeRemove();
            View.__super__.remove.call(this);
        }
    });

    /**
     * Skull.Application is very basic sample of application.
     * It does several things:
     * 1. creates registry and registers itself as 'app'
     * 2. detects domain and other passes URL to UrlProvider
     * 3. instantiates syncer
     * 4. instantiates router
     * 5. Detects if debug mode is on
     * 5. renders root view and starts Backbone.history, if autostart option passed
     *
     * App dispatches route changes. Bind to 'path' event to handle them.
     * @class Skull.Application
     * @extends Skull.Observable
     */
    var Application = Skull.Application = Observable.extend(/** @lends Skull.Application.prototype */{
        defaults: {
            node: 'html',
            router: Backbone.Router,
            syncer: Skull.Syncer,
            template: Skull.Template,


            history: {
                root: '/'
            }
        },

        /**
         * @param options app options
         * @param {Skull.View} options.rootView Skull.View class, intended to be root view
         * @param {Backbone.Router} options.router Router class to be used
         * @param {Skull.Syncer} [options.syncer=Skull.Syncer] Syncer class to be used
         * @param {$|String|HTMLElement} [options.node='html'] root node for application; gets passed to options.rootView
         * @param {String} [options.dataDomainSelector] selector to be passed to Skull.detectDomain
         * @param {Object} [options.urlOptions] options for {@link Skull.UrlProvider}.
         * @param {Boolean} [options.debug=false] Whether we are in debug mode, you can provide other ways for checking it
         *
         * @param {Boolean} [options.autostart=false] Whether application should start right when instantiated
         */
        initialize: function (options) {
            var registry = this.registry = new Skull.ResourceRegistry(),
                register = _.bind(registry.register, registry);

            register('app', this);

            this.params = _.extend({}, this.defaults, options);

            // determine if we're in debug mode
            register('debug', this._isDebug(this.params));

            // URLs detecting
            var domain = register('domain', Skull.detectDomain(this.params.dataDomainSelector)),
                urlProvider = register(
                    'urlProvider',
                    new Skull.UrlProvider(_.extend({}, domain, this.params.urlOptions))
                );
            register('getApiUrl', _.bind(urlProvider.getApiUrl, urlProvider));

            // create router
            var router = register('router', new this.params.router());
            router.on('all', this.onRoute, this);

            // create syncer
            register('syncer', new this.params.syncer({registry: registry}));

            // create template handler
            register('template', new this.params.template());


            // start app, if we should
            this.params.autostart && this.start();
        },

        /**
         * Renders root view and starts up Backbone.history.
         * Call this when your app is ready (or pass options.autostart to Skull.Application#initialize).
         * Feel free to override.
         */
        start: function () {
            this.registry.register(
                'rootView',
                new this.params.rootView({el: this.params.node}, {registry: this.registry})
            );

            Backbone.history.start(this.params.history);
        },

        /**
         * Primarily dispatches route change. Feel free to override.
         * @param routeName
         */
        onRoute: function (routeName) {
            var path = routeName.split(':')[1];
            this.trigger('path', path, _.chain(arguments).toArray().tail().value());
        },

        /**
         * How application determines if debug is on. Feel free to override,
         * this naïve implementation considers only if there's truthy field `debug`
         * @param {Object} params
         * @private
         */
        _isDebug: function (params) {
            this.debug = !!params.debug;
        }
    });

    return Skull
}));
