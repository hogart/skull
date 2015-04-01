/* eslint-env mocha */
/* global mocha, chai, fnd */
(function (mocha, assert, Skull) {
    'use strict';

    suite('.Abstract', function () {
        var Abstract = Skull.Abstract;
        var paramsAmount;

        var MyClass = Abstract.extend({
            initialize: function () {
                assert.lengthOf(arguments, paramsAmount, 'Ok with ' + paramsAmount + ' arguments');
            }
        });

        test('initialize called with same params as passed to constructor', function () {
            paramsAmount = 3;
            new MyClass('firstArg', 'secondArg', 'third');

            paramsAmount = 0;
            new MyClass();
        });
    });
})(mocha, chai.assert, Skull);