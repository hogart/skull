define(
    function (require) {
        var Skull = require('skull'),
            ResourceRegistry = Skull.ResourceRegistry,
            registry = new ResourceRegistry,
            passReg = {registry: registry},
            RestModel = Skull.RestModel;

        registry.register('getApiUrl', function () { return '/' });
        registry.register('syncer', new Skull.Syncer(passReg));


        QUnit.module('Skull.RestModel', {
            setup: function () { },
            teardown: function () {  }
        });

        QUnit.test('Correct generation of URL on base of `resource`', function (QUnit) {
            var CustomFailModel = RestModel.extend({});

            QUnit.throws(
                function () {
                    new CustomFailModel({}, passReg)
                },
                'Throws exception, when no `resource` field present'
            );

            var CustomModel = RestModel.extend({
                resource: 'answer'
            });

            var m = new CustomModel({}, passReg);

            QUnit.equal(m.url(), '/answer/', 'Correct URL generated for new model');


            m.set({id: 42});
            QUnit.equal(m.url(), '/answer/42/', 'Correct URL generated for model with id');
        });
    }
);