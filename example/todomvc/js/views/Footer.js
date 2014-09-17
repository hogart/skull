define(
    [
        'Skull',
        'keyCodes',
        'underscore'
    ],

    function (Skull, keyCodes, _) {
        'use strict';

        var FooterView = Skull.View.extend({
            __registry__: function () {
                var reg = this._parentResult(FooterView, '__registry__');
                return _.extend({}, reg, {
                    collection: 'todosCollection',
                    app: 'app'
                });
            },

            events: {
                'click $clearCompleted': 'clearCompleted'
            },

            __ui__: {
                clearCompleted: '#clear-completed',
                itemsLeft: '#todo-count strong',
                completedCount: '$clearCompleted > span',
                filters: '#filters a'
            },

            initialize: function (options) {
                FooterView.__super__.initialize.apply(this, arguments);

                this.onRender();

                this.listenTo(this.collection, 'change:completed add remove', this.onCollectionChange);

                this.listenTo(this.app, 'path', this.onPath);
            },

            onPath: function (pathName) {
                this.filters
                    .removeClass('selected')
                    .filter('[href="#/' + (pathName || '') + '"]')
                    .addClass('selected');
            },

            onCollectionChange: function () {
                var overallTodos = this.collection.length;

                if (overallTodos) {
                    this.$el.show();
                } else {
                    this.$el.hide();
                    return;
                }

                var hasCompleted = this.collection.completed();

                if (hasCompleted) {
                    this.ui.clearCompleted.show();
                    this.ui.completedCount.text(hasCompleted.length);
                }

                this.ui.itemsLeft.text(overallTodos - hasCompleted);
            },

            // Clear all completed todo items, destroying their models.
            clearCompleted: function () {
                this.collection.clearCompleted();
                return false;
            }
        });

        return FooterView;
    }
);