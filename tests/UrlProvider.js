define(
    function (require) {
        var Skull = require('skull');

        var provider;


        QUnit.module('Skull.UrlProvider', {
            setup: function () { provider = new Skull.UrlProvider({}) },
            teardown: function () { provider = null }
        });

        QUnit.test('prefix and domain', function () {
            provider.set({ host: 'example.com', prefix: 'rest' });
            QUnit.equal(provider.getApiUrl(), '//example.com/rest/');
        });

        QUnit.test('prefix, domain, port', function () {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080 })
            QUnit.equal(provider.getApiUrl(), '//example.com:8080/rest/');
        });

        QUnit.test('prefix, domain, port, proto', function () {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080, protocol: 'https' })
            QUnit.equal(provider.getApiUrl(), 'https://example.com:8080/rest/');
        });

        QUnit.test('version and type', function () {
            provider.set({ version: '0.1.0', type: 'orders' })
            QUnit.equal(provider.getApiUrl(), '/orders/0.1.0/');
        });

        QUnit.test('version, type and prefix', function () {
            provider.set({ version: '0.1.0', type: 'orders', prefix: 'rest' })
            QUnit.equal(provider.getApiUrl(), '/rest/orders/0.1.0/');
        });
    }
);