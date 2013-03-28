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
    var ResourceRegistry = Skull.ResourceRegistry = Skull.Abstract.extend({
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


    var UrlProvider = Skull.UrlProvider = Abstract.extend({
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

        set: function (options) {
            this.cachedPath = this.cachedUrl = false; // drop cache
            this.params = _.extend({}, this.defaults, options);
        },

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

        getApiPath: function () {
            if (!this.cachedUrl) {
                var parts = _.compact([this.params.prefix, this.params.type, this.params.version]);
                this.cachedUrl = '/' + parts.join('/') + '/';
            }

            return this.cachedUrl;
        }
    });

    /**
     * Backbone.sync OO-style
     * Can emit auhorized requests, when provided with getToken function and authHeaderName
     */
    var Syncer = Skull.Syncer = Skull.Abstract.extend({
        /**
         * Map from CRUD to HTTP for our default syncer implementation.
         * @private
         */
        _methodMap: {
            'create': 'POST',
            'update': 'PUT',
            'delete': 'DELETE',
            'read':   'GET',
            'patch': 'PATCH'
        },

        /**
         * @private
         */
        _urlError: function () {
            throw new Error('A "url" property or function must be specified');
        },

        initialize: function (options) {
            this.getToken = options.getToken;
            this.authHeaderName = options.authHeaderName;

            this.emulateHTTP = options.emulateHTTP || false;
            this.emulateJSON = options.emulateJSON || false;
        },

        sync: function(method, model, options) {
            var type = this._methodMap[method];

            // Default options, unless specified.
            _.defaults(options || (options = {}), {
                emulateHTTP: this.emulateHTTP,
                emulateJSON: this.emulateJSON
            });

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
         * Augments request params with authorization header
         * @param {Object} params
         * @returns {Object}
         * @private
         */
        _authorize: function (params) {
            if (this.getToken && this.getToken() && this.authHeaderName) {
                params.headers[this.authHeaderName] = this.getToken();
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
     * @class Template
     */
    var Template = Skull.Template = Abstract.extend({
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

            if (options.tplFunction) {
                this.tplFunction = options.tplFunction
            }
        },

        /**
         * Fetches template by name.
         * @param {String} name
         * @returns {jQuery}
         * @private
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
         * @private
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
         * @private
         */
        _compileTemplate: function (rawTemplate) {
            return this.tplFunction(rawTemplate);
        },

        /**
         * Gets compiled template by its name
         * @param {String} name
         * @returns {Function}
         * @private
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
         * @private
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
     * registry handling, silentSet method and syncStart and syncEnd events
     * @class Skull.Model
     * @extends Backbone.Model
     */
    var Model = Skull.Model = Backbone.Model.extend(/** @lends Skull.Model.prototype */{
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

        /**
         * Overridden for registry handling
         * @returns {this.constructor}
         */
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

        /**
         * Prepare a hash of attributes (or other model) to be added to this collection.
         * Takes care of registry passing.
         * @param {Object} attrs future model attrs
         * @param {Object} [options={}]
         * @private
         */
        _prepareModel: function (attrs, options) {
            (options || (options = {})).registry = this.registry;

            Collection.__super__._prepareModel.call(this, attrs, options);
        }
    });

    /**
     * Skull.RestCollection is Collection more suitable for REST, with reasonable defaults
     * @class Skull.RestCollection
     * @extends Skull.Collection
     */
    var RestCollection = Collection.extend(/** @lends Skull.RestCollection.prototype */{
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

    var View = Skull.View = Backbone.View.extend({
        __registry__: {
            template: 'template'
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

    /**
     * Skull.Application is very basic sample of application.
     * It does several things:
     * 1. creates registry and registers itself as 'app'
     * 2. detects domain and other url options
     * 3. instantiates syncer
     * 4. instantiates router
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
         * @param {Object} [options.urlOptions] options for @see Skull.UrlProvider.
         *
         * @param {Boolean} [options.autostart=false] Whether application should start right when instantiated
         */
        initialize: function (options) {
            this.registry = new Skull.ResourceRegistry();
            var register = _.bind(registry.register, register);
            register('app', this);

            this.params = _.extend({}, this.defaults, options);

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
            register('syncer', new this.params.syncer());

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
        }
    });

    return Skull
}));