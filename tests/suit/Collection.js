define(
    function (require) {
        require('mockjax');

        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            Collection = Skull.Collection;

        registry.register('syncer', new Skull.Syncer(passReg));

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
    }
);