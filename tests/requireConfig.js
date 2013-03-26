var require = {
//    baseUrl: '/',
    paths: {
        lib: '/lib',
        _: '/lib/underscore',
        backbone: '/lib/backbone',
        jquery: '/lib/jquery',
        skull: '/src/Skull',
        'tests/index-r': '/tests/index-r.js'
    },

    shim: {
        jquery: {exports: '$'}
    }
};