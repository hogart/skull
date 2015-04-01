/* eslint-env mocha */
/* global mocha, chai, fnd */
(function (mocha, assert, Skull) {
    'use strict';

    var ResourceRegistry = Skull.ResourceRegistry;
    var registry = new ResourceRegistry();
    var passReg = {registry: registry};
    var Collection = Skull.Collection;
    var Model = Skull.Model;

    registry.register('syncer', new Skull.Syncer(passReg));
    registry.register('getApiUrl', function () { return '/'; });

    function createCollection(options) {
        return new Collection([], _.extend({}, passReg, options));
    }

    suite('.Collection', function () {
        test('Cloned collection has registry', function () {
            var collection = createCollection();
            var clonedCollection = collection.clone();

            assert.property(clonedCollection, 'registry', 'Cloned properly');
        });

        test('Added model has registry', function () {
            var collection = createCollection();

            collection.add({});

            assert.property(collection.at(0), 'registry', 'Added properly');
        });

        test('Correct generation of URL on base of `resource`', function () {
            var CustomModel = Model.extend({
                resource: 'answer'
            });
            var CustomCollection = Collection.extend({
                model: CustomModel
            });
            var c = new CustomCollection([], passReg);

            assert.equal(c.url(), '/answer/', 'Correct URL generated for collection');
        });

    });
})(mocha, chai.assert, Skull);