define(
    [
        'Skull',
        'models/Todo',
        'underscore'
    ],
    function (Skull, ModelTodo, _) {
        'use strict';

        var CollectionTodo = Skull.Collection.extend({
            model: ModelTodo,

            /**
             * Filter down the list of all todo items that are finished.
             * @return [ModelTodo]
             */
            completed: function () {
                return this.where({completed: true});
            },

            /**
             * Mark every todo as completed (or not)
             * @param isCompleted
             */
            markCompleted: function (isCompleted) {
                this.each(function (todo) {
                    todo.save({completed: isCompleted});
                });
            },

            /**
             * Clear all completed todos by destroying models
             */
            clearCompleted: function () {
                _.invoke(this.completed(), 'destroy');
            }
        });

        return CollectionTodo;
    }
);