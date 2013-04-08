define(
    function (require) {
        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            RestCollection = Skull.RestCollection,
            RestModel = Skull.RestModel;

        registry.register('getApiUrl', function () { return '/' });
        registry.register('syncer', new Skull.Syncer(passReg));


        QUnit.module('Skull.RestCollection', {
            setup: function () { },
            teardown: function () {  }
        });

        QUnit.test('Correct generation of URL on base of `resource`', function (QUnit) {
            var CustomFailCollection = RestCollection.extend({});

            QUnit.throws(
                function () {
                    new CustomFailCollection({}, passReg)
                },
                'Throws exception, when no `resource` field present'
            );

            var CustomModel = RestModel.extend({
                resource: 'answer'
            });
            var CustomCollection = RestCollection.extend({
                model: CustomModel
            });

            var c = new CustomCollection([], passReg);

            QUnit.equal(c.url(), '/answer/', 'Correct URL generated for collection');
        });
    }
);