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

        QUnit.test('registry stores and fetches plain resources', 3, function (QUnit) {
            var resName = 'testRes',
                val = 'testValue';

            registry.register(resName, val);

            QUnit.equal(registry._storage[resName], val, 'Registry stored object correctly');
            QUnit.equal(registry.acquire(resName), val, 'Registry fetched correct object');

            QUnit.equal(registry.acquire('some crazy key'), undefined, 'Registry returned undefined to non-existent key');
        });

        QUnit.test('registry stores and fetches factories', 4, function (QUnit) {
            var option = {answer: 42},
                param = {question: 'To be or not to be'},
                resName = 'testFactory';

            registry.register(resName, testFactory, option);

            QUnit.deepEqual(registry._fabric[resName][0], testFactory, 'Registry stored factory correctly');
            QUnit.deepEqual(registry._fabric[resName][1], option, 'Registry stored factory pre-options correctly');

            QUnit.deepEqual(
                registry.acquire(resName, param),
                _.extend({}, option, param)
            );

            QUnit.equal(registry.acquire('some crazy key', {test: true}), undefined, 'Registry returned undefined to non-existent key');

            registry.unregister(resName, true);
        });

        QUnit.test('registry memoizes factories call', 4, function (QUnit) {
            var option = {answer: 42},
                param = {question: 'To be or not to be'},
                resName = 'testFactory',
                callCounter = 0;

            function testMemoizedFactory (value) {
                callCounter++;
                return value;
            }

            registry.register(resName, testMemoizedFactory, option);

            var firstResult = registry.acquire(resName, param);
            QUnit.equal(callCounter, 1, 'Fabric was called first time');

            var memoizedResult = registry.acquire(resName, param);
            QUnit.equal(callCounter, 1, 'Fabric was not called second time');

            QUnit.deepEqual(firstResult, memoizedResult, 'Memoized results are identical');

            registry.acquire(resName, {someOtherParam: Math.PI});
            QUnit.equal(callCounter, 2, 'Fabric was called when acquired with different params');

            registry.unregister(resName, true);
        });

        registry.register('answer', 42);
        registry.register('fabric', function (val) { return val; }, option);

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

            QUnit.equal(obj.answer, 42, 'Plain resource fetched correctly');
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param), 'Fabric result fetched correctly');
        });

        QUnit.test('processRegistry acquires values from registry when __registry__ is array', function (QUnit) {
            var param = {question: 'To be or not to be'},
                obj = {
                registry: registry,
                __registry__: [
                    'answer',
                    ['fabric', param]
                ]
            };

            processRegistry(obj);

            QUnit.equal(obj.answer, 42, 'Plain resource fetched correctly');
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param), 'Fabric result fetched correctly');
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

            QUnit.equal(obj.answer, 42, 'Plain resource fetched correctly');
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param), 'Fabric result fetched correctly');
        });
    }
);