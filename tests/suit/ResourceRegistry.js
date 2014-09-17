define(
    function (require) {
        'use strict';

        var ResourceRegistry = require('skull').ResourceRegistry,
            _ = require('underscore'),
            processRegistry = ResourceRegistry.processRegistry,
            registry = new ResourceRegistry(),
            option = {answer: 42};

        function testFactory (value) {
            return value;
        }


        QUnit.module('Skull.ResourceRegistry', {
//            setup: function () {  },
//            teardown: function () {  }
        });

        QUnit.test('registry stores and fetches plain resources', 2, function (QUnit) {
            var resName = 'testRes',
                val = 'testValue';

            registry.register(resName, val);

            QUnit.equal(registry._storage[resName], val);
            QUnit.equal(registry.acquire(resName), val);
        });

        QUnit.test('registry stores and fetches factories', 3, function (QUnit) {
            var option = {answer: 42},
                param = {question: 'To be or not to be'},
                resName = 'testFactory';

            registry.register(resName, testFactory, option);

            QUnit.deepEqual(registry._fabric[resName][0], testFactory);
            QUnit.deepEqual(registry._fabric[resName][1], option);

            QUnit.deepEqual(
                registry.acquire(resName, param),
                _.extend({}, option, param)
            );
        });

        QUnit.test('ResourceRegistry#acquire returns undefined on unknown key', 2, function (QUnit) {
            QUnit.equal(registry.acquire('some crazy key'), undefined);
            QUnit.equal(registry.acquire('some crazy key', {test: true}), undefined);
        });

        registry.register('answer', 42);
        registry.register('fabric', function (val) { return val; }, option);


        QUnit.module('Skull.processRegistry', {
//            setup: function () {  },
//            teardown: function () {  }
        });

        QUnit.test('processRegistry acquires values from registry when __registry__ is plain object', function (QUnit) {
            var param = {question: 'To be or not to be'},
                obj = {
                registry: registry,
                __registry__: {
                    answer: 'answer',
                    fabric: ['fabric', param]
                }
            };

            processRegistry(obj);

            QUnit.equal(obj.answer, 42);
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param));
        });

        QUnit.test('processRegistry acquires values from registry when __registry__ is function', function (QUnit) {
            var param = {question: 'To be or not to be'},
                obj = {
                registry: registry,
                __registry__: function () {
                    return {
                        answer: 'answer',
                        fabric: ['fabric', param]
                    };
                }
            };

            processRegistry(obj);

            QUnit.equal(obj.answer, 42);
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param));
        });
    }
);