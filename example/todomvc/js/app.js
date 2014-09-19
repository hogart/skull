require.config({
    paths: {
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        jquery: '../bower_components/jquery/dist/jquery',
        Skull: '../bower_components/skull/src/Skull'
    }
});

require(
    [
        'Skull',
        './Application',
        './Router',
        './StorageSyncer',

        './views/Root',
        './collections/Todo'
    ],

    function (Skull, Application, Router, StorageSyncer, ViewRoot, TodoCollection) {
        'use strict';

        var app = new Application({
            router: Router,

            rootView: ViewRoot
        });

        app.registry.register('syncer', StorageSyncer.instantiate.bind(StorageSyncer), {registry: app.registry});

        app.registry.register('todosCollection', new TodoCollection(null, {registry: app.registry, firstStart: !localStorage.getItem('secondStart')}));

        app.start();

        localStorage.setItem('secondStart', true);
    }
);