define(
    function (require) {
        var Abstract = require('skull').Abstract,
            paramsAmount;

        var MyClass = Abstract.extend({
            initialize: function () {
                QUnit.equal(arguments.length, paramsAmount, 'Ok with ' + paramsAmount + ' arguments');
            }
        });

        QUnit.module('Skull.Abstract', {
            setup: function () {  },
            teardown: function () { }
        });

        QUnit.test('initialize called with same params as passed to constructor', function () {
            paramsAmount = 3;
            new MyClass('firstArg', 'secondArg', 'third');
        });

        QUnit.test('initialize called with same params as passed to constructor', function () {
            paramsAmount = 0;
            new MyClass();
        });

    }
);