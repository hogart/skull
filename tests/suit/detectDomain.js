define(
    function (require) {
        'use strict';

        var detectDomain = require('skull').detectDomain,
            $ = require('jquery'),
            scriptTag;

        function createTag (/** String */value, /**String */attrName) {
            attrName = attrName || 'data-api-domain';
            scriptTag = $('<script ' + attrName + '="' + value + '"></script>');
            $('body').append(scriptTag);
        }

        QUnit.module('Skull.detectDomain', {
//            setup: function () {  },
            teardown: function () { scriptTag.remove() }
        });

        QUnit.test('domain and protocol', function (QUnit) {
            createTag('http://example.com');

            QUnit.deepEqual(detectDomain(), {host: 'example.com', protocol: 'http'});
        });

        QUnit.test('custom attribute name', function (QUnit) {
            createTag('https://example.com', 'data-domain');

            QUnit.deepEqual(detectDomain('data-domain'), {host: 'example.com', protocol: 'https'});
        });
    }
);