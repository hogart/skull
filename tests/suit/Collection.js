define(
    function (require) {
        require('mockjax');

        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            Collection = Skull.Collection;

        $.mockjaxSettings = {
            contentType: 'text/json',
            status: 200,
            responseText: [
                {answer: 42}
            ]

        };

        registry.register('syncer', new Skull.Syncer(passReg));

        function createCollection(options) {
            return new Collection([], _.extend({}, passReg, options));
        }

        QUnit.module('Skull.Collection', {
            setup: function () { },
            teardown: function () { $.mockjaxClear(); }
        });

        QUnit.asyncTest('`syncStart` event is fired', 1, function (QUnit) {
            var collection = createCollection({url: '/syncStart/event/fired'});

            $.mockjax({
                url: collection.url
            });

            collection.on('syncStart', function () {
                QUnit.ok(true, '`syncStart` fired');
                start();
            });
            collection.fetch();
        });

        QUnit.asyncTest('`syncEnd` event is fired on ok response', function (QUnit) {
            var collection = createCollection({url: '/syncEnd/event/fired/good'});

            $.mockjax({
                url: collection.url
            });

            collection.on('syncEnd', function () {
                QUnit.ok(true, '`syncEnd` fired');
                start();
            });
            collection.fetch();
        });

        QUnit.asyncTest('`syncEnd` event is fired on bad response', function (QUnit) {
            var collection = createCollection({url: '/syncEnd/event/fired/bad'});

            $.mockjax({
                url: collection.url,
                status: 401
            });

            collection.on('syncEnd', function () {
                QUnit.ok(true, '`syncEnd` fired');
                start();
            });
            collection.fetch();
        });

        QUnit.asyncTest('`success` callback is called on ok response', function (QUnit) {
            var collection = createCollection({url: '/onsuccess'});

            $.mockjax({
                url: collection.url
            });

            collection.fetch({
                success: function () {
                    QUnit.ok(true, '`success` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('`always` callback is called on ok response', function (QUnit) {
            var collection = createCollection({url: '/onsuccess/always'});

            $.mockjax({
                url: collection.url
            });

            collection.fetch({
                always: function () {
                    QUnit.ok(true, '`always` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('`error` callback is called on bad response', function (QUnit) {
            var collection = createCollection({url: '/error'});

            $.mockjax({
                url: collection.url,
                status: 401
            });

            collection.fetch({
                error: function () {
                    QUnit.ok(true, '`error` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('`always` callback is called on bad response', function (QUnit) {
            var collection = createCollection({url: '/onerror/always'});

            $.mockjax({
                url: collection.url
            });

            collection.fetch({
                always: function () {
                    QUnit.ok(true, '`always` was called');
                    start();
                }
            });
        });

        QUnit.test('Cloned collection has registry', function (QUnit) {
            var collection = createCollection(),
                clonedModel = collection.clone();

            QUnit.ok(clonedModel.registry, 'Cloned properly');
        });

        QUnit.test('Added model has registry', function (QUnit) {
            var collection = createCollection();

            collection.add({});

            QUnit.ok(collection.at(0).registry, 'Added properly');
        });
    }
);