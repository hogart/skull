/* eslint-env mocha */
/* global mocha, chai, fnd */
(function (mocha, assert, Skull) {
    'use strict';

    var UrlProvider = Skull.UrlProvider;
    var provider;

    
    suite('.UrlProvider', function () {
        setup(function () { 
            provider = new UrlProvider({}); 
        });
        teardown(function () { 
            provider = null; 
        });
        
        test('prefix and domain', function () {
            provider.set({ host: 'example.com', prefix: 'rest' });
            assert.equal(provider.getApiUrl(), '//example.com/rest/');
        });

        test('prefix, domain, port', function () {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080 });
            assert.equal(provider.getApiUrl(), '//example.com:8080/rest/');
        });

        test('prefix, domain, port, protocol', function () {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080, protocol: 'https' });
            assert.equal(provider.getApiUrl(), 'https://example.com:8080/rest/');
        });
    });
})(mocha, chai.assert, Skull);