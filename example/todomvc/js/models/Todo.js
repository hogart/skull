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

            toggleCompleted: function () {
                this.set('completed', !this.get('completed'));
            }
        });

        return ModelTodo;
    }
);