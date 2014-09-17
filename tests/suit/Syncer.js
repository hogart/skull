define(
    function (require) {
        'use strict';

        var Skull = require('skull'),
            Syncer = Skull.Syncer,
            Observable = Skull.Observable,
            registry = new Skull.ResourceRegistry(),
            passReg = {registry: registry},
            $ = require('jquery'),

            tokenStr = 'Raxacoricofallapatorius';

        require('mockjax');

        $.mockjaxSettings = {
            contentType: 'text/json',
            status: 200,
            responseText: {
                answer: 42
            }
        };


        var MockModel = Observable.extend({
                url: '/syncerTest',
                toJSON: function () {
                    return {answer: 42};
                }
            }),
            model = new MockModel();


        QUnit.module('Skull.Syncer', {
            setup: function () {},
            teardown: function () { $.mockjaxClear(); }
        });

        QUnit.asyncTest('Correctly handles authorization', function (QUnit) {
            var syncer = new Syncer(passReg);

            $.mockjax({
                url: model.url,
                response: function () {
                    QUnit.ok(!this.headers[syncer.params.authHeaderName], 'No auth headers present');
                    /* jshint -W117 */
                    start();
                    /* jshint -W117 */
                }
            });

            syncer.sync('update', model);
        });

        QUnit.asyncTest('Correctly handles authorization', function (QUnit) {
            registry.register('getToken', function () { return tokenStr; });

             var syncer = new Syncer(passReg);

            $.mockjax({
                url: model.url,
                response: function () {
                    QUnit.equal(this.headers[syncer.params.authHeaderName], tokenStr, 'Correct auth header');
                    /* jshint -W117 */
                    start();
                    /* jshint -W117 */
                }
             });

             syncer.sync('read', model);
        });
    }
);