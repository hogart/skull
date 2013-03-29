define(
    function (require) {
        var Observable = require('skull').Observable;


        QUnit.module('Skull.Observable', {
//            setup: function () {  },
//            teardown: function () {  }
        });

        QUnit.test('descendants has appropriate methods', 7, function (QUnit) {
            var Bus = Observable.extend({}),
                bus = new Bus;

            QUnit.ok(bus.on, 'Has `on`');
            QUnit.ok(bus.off, 'Has `off`');
            QUnit.ok(bus.once, 'Has `once`');
            QUnit.ok(bus.trigger, 'Has `trigger`');
            QUnit.ok(bus.listenTo, 'Has `listenTo`');
            QUnit.ok(bus.listenToOnce, 'Has `listenTo`');
            QUnit.ok(bus.stopListening, 'Has `stopListening`');
        });
    }
);