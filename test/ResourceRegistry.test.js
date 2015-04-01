/* eslint-env mocha, browser */
/* global mocha, chai, Skull, _ */
(function (mocha, assert, Skull) {
    'use strict';

    var ResourceRegistry = Skull.ResourceRegistry;
    var processRegistry = ResourceRegistry.processRegistry;
    var registry = new ResourceRegistry();

    function testFactory (value) {
        return value;
    }

    suite('.ResourceRegistry', function () {
        test('registry stores and fetches plain resources', function () {
            var resName = 'testRes';
            var val = 'testValue';

            registry.register(resName, val);

            assert.equal(registry.acquire(resName), val, 'Registry fetched correct object');
            assert.equal(registry.acquire('some crazy key'), undefined, 'Registry returned undefined to non-existent key');

            registry.unregister(resName);
        });

        test('registry stores and fetches factories', function () {
            var option = {answer: 42};
            var param = {question: 'To be or not to be'};
            var resName = 'testFactory';

            registry.register(resName, testFactory, option);

            assert.deepEqual(
                registry.acquire(resName, param),
                _.extend({}, option, param)
            );

            assert.equal(registry.acquire('some crazy key', {test: true}), undefined, 'Registry returned undefined to non-existent key');

            registry.unregister(resName, true);
        });

        test('registry memoizes factories call', function () {
            var option = {answer: 42};
            var param = {question: 'To be or not to be'};
            var resName = 'testFactory';
            var callCounter = 0;

            function testMemoizedFactory (value) {
                callCounter++;
                return value;
            }

            registry.register(resName, testMemoizedFactory, option);

            var firstResult = registry.acquire(resName, param);
            assert.equal(callCounter, 1, 'Factory was called first time');

            var memoizedResult = registry.acquire(resName, param);
            assert.equal(callCounter, 1, 'Factory was not called second time');

            assert.deepEqual(firstResult, memoizedResult, 'Memoized results are identical');

            registry.acquire(resName, {someOtherParam: Math.PI});
            assert.equal(callCounter, 2, 'Factory was called when acquired with different params');

            registry.unregister(resName, true);
        });

        suite('Various form of __registry__ processing', function () {
            var option = {answer: 42};

            setup(function () {
                registry.register('answer', 42);
                registry.register('factory', function (val) { return val; }, option);
            });

            teardown(function () {
                registry.unregister('answer');
                registry.unregister('factory', true);
            });

            test('processRegistry acquires values from registry when __registry__ is plain object', function () {
                var param = {question: 'To be or not to be'},
                    obj = {
                    registry: registry,
                    __registry__: {
                        answer: 'answer',
                        factory: ['factory', param]
                    }
                };

                processRegistry(obj);

                assert.equal(obj.answer, 42, 'Plain resource fetched correctly');
                assert.deepEqual(obj.factory, _.extend({}, option, param), 'Factory result fetched correctly');
            });

            test('processRegistry acquires values from registry when __registry__ is array', function () {
                var param = {question: 'To be or not to be'},
                    obj = {
                    registry: registry,
                    __registry__: [
                        'answer',
                        ['factory', param]
                    ]
                };

                processRegistry(obj);

                assert.equal(obj.answer, 42, 'Plain resource fetched correctly');
                assert.deepEqual(obj.factory, _.extend({}, option, param), 'Factory result fetched correctly');
            });

            test('processRegistry acquires values from registry when __registry__ is function', function () {
                var param = {question: 'To be or not to be'},
                    obj = {
                    registry: registry,
                    __registry__: function () {
                        return {
                            answer: 'answer',
                            factory: ['factory', param]
                        };
                    }
                };

                processRegistry(obj);

                assert.equal(obj.answer, 42, 'Plain resource fetched correctly');
                assert.deepEqual(obj.factory, _.extend({}, option, param), 'Factory result fetched correctly');
            });
        });
    });
})(mocha, chai.assert, Skull);