define(
    [
        'Skull',
        './Todos',
        'underscore'
    ],

    function (Skull, TodosView, _) {
        'use strict';

        var MainView = Skull.View.extend({
            __registry__: function () {
                var reg = this._parentResult(MainView, '__registry__');
                return _.extend({}, reg, {
                    collection: 'todosCollection'
                });
            },

            __children__: {
                '#todo-list': TodosView
            },

            events: {
                'change $toggleAll': 'toggleAllComplete'
            },

            __ui__: {
                toggleAll: '#toggle-all'
            },

            initialize: function (options) {
                MainView.__super__.initialize.apply(this, arguments);

                this.listenTo(this.collection, 'add remove', this.onCollectionChange);

                this.onRender();
            },

            onCollectionChange: function () {
                if (this.collection.length) {
                    this.$el.show();
                } else {
                    this.$el.hide();
                }
            },

            toggleAllComplete: function (event) {
                var isCompleted = this.ui.toggleAll.prop('checked');

                this.collection.markCompleted(isCompleted);
            }
        });

        return MainView;
    }
);