define(
    function (require) {
        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            Collection = Skull.Collection,
            Model = Skull.Model;

        registry.register('syncer', new Skull.Syncer(passReg));
        registry.register('getApiUrl', function () { return '/' });

        function createCollection(options) {
            return new Collection([], _.extend({}, passReg, options));
        }

        QUnit.module('Skull.Collection', {
            setup: function () { },
            teardown: function () { }
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

        QUnit.test('Correct generation of URL on base of `resource`', function (QUnit) {

            var CustomModel = Model.extend({
                resource: 'answer'
            });
            var CustomCollection = Collection.extend({
                model: CustomModel
            });

            var c = new CustomCollection([], passReg);

            QUnit.equal(c.url(), '/answer/', 'Correct URL generated for collection');
        });
    }
);