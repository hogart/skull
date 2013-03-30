var require = {
//    baseUrl: '/',
//    urlArgs: "bust=" +  (new Date()).getTime(),
    paths: {
        lib: '/lib',
        underscore: '/lib/underscore',
        backbone: '/lib/backbone',
        jquery: '/lib/jquery',
        skull: '/src/Skull',
        mockjax: '/lib/jquery.mockjax'
    },

    shim: {
        jquery: {exports: '$'},

        'mockjax': {
            deps: ['jquery'],
            exports: 'jQuery.mockjax'
        }
    }
};