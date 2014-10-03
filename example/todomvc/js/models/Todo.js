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

                console.log(attributes.id);

                this.on('change:id', console.log.bind(console));
            },

            toggleCompleted: function () {
                this.set('completed', !this.get('completed'));
            }
        });

        return ModelTodo;
    }
);