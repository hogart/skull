/* eslint-env mocha, browser */
/* global mocha, chai, Skull */
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
            new MyClass('firstArg', 'secondArg', 'third'); // eslint-disable-line no-new

            paramsAmount = 0;
            new MyClass(); // eslint-disable-line no-new
        });
    });
})(mocha, chai.assert, Skull);