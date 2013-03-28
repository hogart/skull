define(
    function (require) {
        var UrlProvider = require('skull').UrlProvider,
            provider;


        QUnit.module('UrlProvider', {
            setup: function () { provider = new UrlProvider({}) },
            teardown: function () { provider = null }
        });

        QUnit.test('prefix and domain', function (QUnit) {
            provider.set({ host: 'example.com', prefix: 'rest' });
            QUnit.equal(provider.getApiUrl(), '//example.com/rest/');
        });

        QUnit.test('prefix, domain, port', function (QUnit) {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080 });
            QUnit.equal(provider.getApiUrl(), '//example.com:8080/rest/');
        });

        QUnit.test('prefix, domain, port, protocol', function (QUnit) {
            provider.set({ prefix: 'rest', host: 'example.com', port: 8080, protocol: 'https' });
            QUnit.equal(provider.getApiUrl(), 'https://example.com:8080/rest/');
        });

        QUnit.test('version and type', function (QUnit) {
            provider.set({ version: '0.1.0', type: 'orders' });
            QUnit.equal(provider.getApiUrl(), '/orders/0.1.0/');
        });

        QUnit.test('version, type and prefix', function (QUnit) {
            provider.set({ version: '0.1.0', type: 'orders', prefix: 'rest' });
            QUnit.equal(provider.getApiUrl(), '/rest/orders/0.1.0/');
        });
    }
);