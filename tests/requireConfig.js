var require = {
//    baseUrl: '/',
//    urlArgs: "bust=" +  (new Date()).getTime(),
    paths: {
        lib: '../lib',
        jquery: '../lib/jquery',
        skull: '../src/Skull',
        mockjax: '../lib/jquery.mockjax',
        Backbone: '../lib/backbone',
        underscore: '../lib/underscore',
        _: '../lib/underscore'
    },

    shim: {
        'mockjax': {
            deps: ['jquery'],
            exports: 'jQuery.mockjax'
        }
    }
};