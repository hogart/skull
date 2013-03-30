define(
    function (require) {
        require('mockjax');

        var Skull = require('skull'),
            registry = new Skull.ResourceRegistry,
            passReg = {registry: registry},
            Model = Skull.Model;

        $.mockjaxSettings = {
            contentType: 'text/json',
            status: 200,
            responseText: {
                answer: 42
            }
        };

        registry.register('syncer', new Skull.Syncer(passReg));

        function createModel(options) {
            return new Model({}, _.extend({}, passReg, options));
        }

        QUnit.module('Skull.Model', {
            setup: function () { },
            teardown: function () { $.mockjaxClear(); }
        });

        QUnit.test('`silentSet` method doesn\'t triggers `change` event', function (QUnit) {
            var model = new Model({}, passReg),
                assertion = true;

            model.on('change:testAttr1', function () {
                assertion = false;
            });
            model.silentSet({testAttr1: true});
            QUnit.deepEqual(model.changedAttributes(), {testAttr1: true}, 'Attribute was correctly set — one argument way');
            QUnit.ok(assertion, 'Event not triggered — one argument way');

            // second part
            model.on('change:testAttr2', function () {
                assertion = false;
            });
            model.silentSet('testAttr2', true);

            QUnit.deepEqual(model.changedAttributes(), {testAttr2: true}, 'Attribute was correctly set — two argument way');
            QUnit.ok(assertion, 'Event not triggered — two argument way');
        });

        QUnit.asyncTest('`syncStart` event is fired', 1, function (QUnit) {
            var model = createModel({url: '/syncStart/event/fired'});

            $.mockjax({
                url: model.url
            });

            model.on('syncStart', function () {
                QUnit.ok(true, '`syncStart` fired');
                start();
            });
            model.sync('read', model);
        });

        QUnit.asyncTest('`syncEnd` event is fired on ok response', function (QUnit) {
            var model = createModel({url: '/syncEnd/event/fired/good'});

            $.mockjax({
                url: model.url
            });

            model.on('syncEnd', function () {
                QUnit.ok(true, '`syncEnd` fired');
                start();
            });
            model.sync('read', model);
        });

        QUnit.asyncTest('`syncEnd` event is fired on bad response', function (QUnit) {
            var model = createModel({url: '/syncEnd/event/fired/bad'});

            $.mockjax({
                url: model.url,
                status: 401
            });

            model.on('syncEnd', function () {
                QUnit.ok(true, '`syncEnd` fired');
                start();
            });
            model.sync('read', model);
        });

        QUnit.asyncTest('success callback is called on ok response', function (QUnit) {
            var model = createModel({url: '/onsuccess'});

            $.mockjax({
                url: model.url
            });

            model.sync('read', model, {
                success: function () {
                    QUnit.ok(true, '`success` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('always callback is called on ok response', function (QUnit) {
            var model = createModel({url: '/onsuccess/always'});

            $.mockjax({
                url: model.url
            });

            model.sync('read', model, {
                always: function () {
                    QUnit.ok(true, '`always` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('error callback is called on bad response', function (QUnit) {
            var model = createModel({url: '/error'});

            $.mockjax({
                url: model.url,
                status: 401
            });

            model.sync('read', model, {
                error: function () {
                    QUnit.ok(true, '`error` was called');
                    start();
                }
            });
        });

        QUnit.asyncTest('always callback is called on bad response', function (QUnit) {
            var model = createModel({url: '/onerror/always'});

            $.mockjax({
                url: model.url
            });

            model.sync('read', model, {
                always: function () {
                    QUnit.ok(true, '`always` was called');
                    start();
                }
            });
        });
    }
);