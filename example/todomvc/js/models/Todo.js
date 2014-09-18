define(
    [
        './Abstract'
    ],
    function (ModelAbstract) {
        'use strict';

        var ModelTodo = ModelAbstract.extend({
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