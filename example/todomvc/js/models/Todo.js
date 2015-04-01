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

            initialize: function (attributes, options) {
                ModelTodo.__super__.initialize.apply(this, arguments);
            },

            toggleCompleted: function () {
                this.set('completed', !this.get('completed'));
            }
        });

        return ModelTodo;
    }
);