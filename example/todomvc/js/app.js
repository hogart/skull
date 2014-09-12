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
            syncer: StorageSyncer,

            rootView: ViewRoot
        });

        app.registry.register('todosCollection', new TodoCollection([], {registry: app.registry}));

        app.start();
    }
);