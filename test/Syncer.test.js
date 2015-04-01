/* eslint-env mocha */
/* global mocha, chai, fnd */
(function (mocha, assert, Skull) {
    'use strict';

    var Syncer = Skull.Syncer;
    var Observable = Skull.Observable;
    var registry = new Skull.ResourceRegistry();
    var passReg = {registry: registry};
    var MockModel = Observable.extend({
        url: '/syncerTest',
        toJSON: function () {
            return {answer: 42};
        }
    });
    var model = new MockModel();

    suite('.Syncer', function () {
        teardown(function () {
            $.mockjax.clear();
        });

        test('Correctly handles authorization', function (done) {
            var syncer = new Syncer(passReg);

            $.mockjax({
                contentType: 'text/json',
                status: 200,
                responseText: {
                    answer: 42
                },
                url: model.url,
                response: function () {
                    assert.notProperty(this.headers, syncer.params.authHeaderName, 'No auth headers present');
                    done();
                }
            });

            syncer.sync('update', model);
        });

        test('Correctly handles authorization', function (done) {
            var tokenStr = 'Raxacoricofallapatorius';
            registry.register('getToken', function () {
                return tokenStr;
            });

            var syncer = new Syncer(passReg);

            $.mockjax(function (requestSettings) {
                if (requestSettings.url === model.url) {
                    return {
                        response: function (origSettings) {
                            assert.equal(requestSettings.headers[syncer.params.authHeaderName], tokenStr);
                            done();
                        }
                    };
                }
            });

            syncer.sync('read', model);
        });
    });
})(mocha, chai.assert, Skull);