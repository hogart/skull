define(
    function (require) {
        var Observable = require('skull').Observable


        QUnit.module('Skull.Observable', {
//            setup: function () {  },
//            teardown: function () {  }
        });

        QUnit.test('Observable descendant has appropriate methods', 4, function () {
            var Bus = Observable.extend({}),
                bus = new Bus;

            QUnit.ok(bus.on, 'Has `on`');
            QUnit.ok(bus.off, 'Has `off`');
            QUnit.ok(bus.listenTo, 'Has `listenTo`');
            QUnit.ok(bus.stopListening, 'Has `stopListening`');
        });
    }
);