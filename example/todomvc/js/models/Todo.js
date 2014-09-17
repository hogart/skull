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
            },

            resource: 'todos',

            toggleCompleted: function () {
                this.set('completed', !this.get('completed'));
            }
        });

        return ModelTodo;
    }
);