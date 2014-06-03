define(
    function (require) {
        var Skull = require('skull'),
            processRegistry = Skull.processRegistry,
            registry = new Skull.ResourceRegistry,
            option = {answer: 42};

        registry.register('answer', 42);
        registry.register('fabric', function (val) { return val }, option);


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
                    }
                }
            };

            processRegistry(obj);

            QUnit.equal(obj.answer, 42);
            QUnit.deepEqual(obj.fabric, _.extend({}, option, param));
        });
    }
);