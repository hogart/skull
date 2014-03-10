define(
    function (require) {
        require('mockjax');

        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            Model = Skull.Model;

        registry.register('syncer', new Skull.Syncer(passReg));

        function createModel(options) {
            return new Model({}, _.extend({}, passReg, options));
        }

        QUnit.module('Skull.Model', {
            setup: function () { },
            teardown: function () { }
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

        QUnit.test('Cloned model has registry', function (QUnit) {
            var model = createModel(),
                clonedModel = model.clone();

            QUnit.ok(clonedModel.registry, 'Cloned properly');
        });
    }
);