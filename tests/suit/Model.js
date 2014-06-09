define(
    function (require) {
        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            Model = Skull.Model;

        registry.register('syncer', new Skull.Syncer(passReg));
        registry.register('getApiUrl', function () { return '/' });

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

        QUnit.test('Correct generation of URL on base of `resource`', function (QUnit) {

            var CustomModel = Model.extend({
                resource: 'answer'
            });

            var m = new CustomModel({}, passReg);

            QUnit.equal(m.url(), '/answer/', 'Correct URL generated for new model');


            m.set({id: 42});
            QUnit.equal(m.url(), '/answer/42/', 'Correct URL generated for model with id');
        });
    }
);