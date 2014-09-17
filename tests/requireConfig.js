var require = {
//    baseUrl: '/',
//    urlArgs: "bust=" +  (new Date()).getTime(),
    paths: {
        jquery: '../lib/jquery/dist/jquery',
        skull: '../src/Skull',
        mockjax: '../lib/jquery.mockjax',
        backbone: '../lib/backbone/backbone',
        underscore: '../lib/underscore/underscore'
    },

    shim: {
        'mockjax': {
            deps: ['jquery'],
            exports: 'jQuery.mockjax'
        }
    }
};