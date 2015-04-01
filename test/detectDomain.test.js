/* eslint-env mocha, browser, jquery */
/* global mocha, chai, Skull */
(function (mocha, assert, Skull) {
    'use strict';

    var detectDomain = Skull.detectDomain;
    var scriptTag;

    function createTag (/** String */value, /**String */attrName) {
        attrName = attrName || 'data-api-domain';
        scriptTag = $('<script ' + attrName + '="' + value + '"></script>');
        $('body').append(scriptTag);
    }

    suite('.detectDomain', function () {
        teardown(function () {
            scriptTag.remove();
        });

        test('domain and protocol', function () {
            createTag('http://example.com');

            assert.deepEqual(detectDomain(), {host: 'example.com', protocol: 'http'});
        });

        test('custom attribute name', function () {
            createTag('https://example.com', 'data-domain');

            assert.deepEqual(detectDomain('data-domain'), {host: 'example.com', protocol: 'https'});
        });
    });
})(mocha, chai.assert, Skull);