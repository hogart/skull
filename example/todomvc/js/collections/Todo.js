define(
    [
        './Abstract',
        'models/Todo',
        'underscore'
    ],
    function (AbstractCollection, ModelTodo, _) {
        'use strict';

        var CollectionTodo = AbstractCollection.extend({
            model: ModelTodo,

            resource: ModelTodo.prototype.resource,

            initialize: function (models, options) {
                CollectionTodo.__super__.initialize.apply(this, arguments);

                if (options.firstStart) {
                    this.add([
                        {
                            title: 'Create a TodoMVC template',
                            completed: true
                        }, {
                            title: 'Rule the web',
                            completed: false
                        }
                    ]);
                } else {
                    this.fetch();
                }
            },

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