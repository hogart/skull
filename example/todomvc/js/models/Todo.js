define(
    [
        'Skull'
    ],
    function (Skull) {
        'use strict';

        var ModelTodo = Skull.Model.extend({
            defaults: {
                title: '',
                completed: false
            }
        });

        return ModelTodo;
    }
);