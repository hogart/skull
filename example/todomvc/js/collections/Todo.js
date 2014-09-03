define(
    [
        'Skull',
        'Model/Todo'
    ],
    function (Skull, ModelTodo) {
        'use strict';

        var CollectionTodo = Skull.Collection.extend({
            model: ModelTodo
        });

        return CollectionTodo;
    }
);