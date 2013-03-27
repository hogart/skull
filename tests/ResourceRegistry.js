define(
    function (require) {
        var ResourceRegistry = require('skull').ResourceRegistry,
            registry = new ResourceRegistry;

        function testFactory (value) {
            return value;
        }


        QUnit.module('Skull.ResourceRegistry', {
//            setup: function () {  },
//            teardown: function () {  }
        });

        QUnit.test('registry stores and fetches plain resources', 2, function () {
            var resName = 'testRes',
                val = 'testValue';

            registry.register(resName, val);

            QUnit.equal(registry._storage[resName], val);
            QUnit.equal(registry.acquire(resName), val);
        });

        QUnit.test('registry stores and fetches factories', 3, function () {
            var option = {answer: 42},
                param = {question: 'To be or not to be'},
                resName = 'testFactory';

            registry.register(resName, testFactory, option);

            QUnit.deepEqual(registry._fabric[resName][0], testFactory);
            QUnit.deepEqual(registry._fabric[resName][1], option);

            QUnit.deepEqual(
                registry.acquire(resName, param),
                _.extend({}, option, param)
            )
        });

        QUnit.test('ResourceRegistry#acquire returns undefined on unknown key', 2, function () {
            QUnit.equal(registry.acquire('some crazy key'), undefined);
            QUnit.equal(registry.acquire('some crazy key', {test: true}), undefined);
        });
    }
);