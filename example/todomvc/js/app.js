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

        var todosFixture = [
            {
                title: 'Create a TodoMVC template',
                completed: true
            }, {
                title: 'Rule the web',
                completed: false
            }
        ];

        try {
            var storedTodos = localStorage.getItem('todos');
            if (storedTodos) {
                todosFixture = JSON.parse();
            }
        } catch (e) {

        }


        app.registry.register('todosCollection', new TodoCollection(todosFixture, {registry: app.registry}));

        app.start();
    }
);