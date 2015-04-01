/* eslint-env mocha, browser */
/* global mocha, chai, Skull */
(function (mocha, assert, Skull) {
    'use strict';

    suite('.Observable', function () {
        test('descendants has appropriate methods', function () {
            var Bus = Skull.Observable.extend({});
            var bus = new Bus();

            assert.isFunction(bus.on, 'Has `on`');
            assert.isFunction(bus.off, 'Has `off`');
            assert.isFunction(bus.once, 'Has `once`');
            assert.isFunction(bus.trigger, 'Has `trigger`');
            assert.isFunction(bus.listenTo, 'Has `listenTo`');
            assert.isFunction(bus.listenToOnce, 'Has `listenTo`');
            assert.isFunction(bus.stopListening, 'Has `stopListening`');
        });
    });
})(mocha, chai.assert, Skull);