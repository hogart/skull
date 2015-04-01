/* eslint-env mocha */
/* global mocha, chai, fnd */
(function (mocha, assert, Skull) {
    'use strict';

    var ResourceRegistry = Skull.ResourceRegistry;
    var registry = new ResourceRegistry();
    var passReg = {registry: registry};
    var Model = Skull.Model;

    registry.register('syncer', new Skull.Syncer(passReg));
    registry.register('getApiUrl', function () { return '/'; });

    function createModel(options) {
        return new Model({}, _.extend({}, passReg, options));
    }
    
    suite('.Model', function () {
        test('`silentSet` method doesn\'t triggers `change` event', function () {
            var model = new Model({}, passReg);
            var assertion = true;

            model.on('change:testAttr1', function () {
                assertion = false;
            });
            model.silentSet({testAttr1: true});
            assert.deepEqual(model.changedAttributes(), {testAttr1: true}, 'Attribute was correctly set — one argument way');
            assert.ok(assertion, 'Event not triggered — one argument way');

            // second part
            model.on('change:testAttr2', function () {
                assertion = false;
            });
            model.silentSet('testAttr2', true);

            assert.deepEqual(model.changedAttributes(), {testAttr2: true}, 'Attribute was correctly set — two argument way');
            assert.ok(assertion, 'Event not triggered — two argument way');
        });

        test('Cloned model has registry', function () {
            var model = createModel();
            var clonedModel = model.clone();

            assert.ok(clonedModel.registry, 'Cloned properly');
        });

        test('Correct generation of URL on base of `resource`', function () {
            var CustomModel = Model.extend({
                resource: 'answer'
            });
            var m = new CustomModel({}, passReg);

            assert.equal(m.url(), '/answer/', 'Correct URL generated for new model');


            m.set({id: 42});
            assert.equal(m.url(), '/answer/42/', 'Correct URL generated for model with id');
        });
    });
})(mocha, chai.assert, Skull);