define(
    [
        'Skull',
        'keyCodes',
        'underscore',
        'jquery'
    ],

    function (Skull, keyCodes, _, $) {
        'use strict';

        var TodosView = Skull.View.extend({
            tpl: 'todoList',

            __registry__: function () {
                var reg = this._parentResult(TodosView, '__registry__');
                return _.extend({}, reg, {
                    collection: 'todosCollection'
                });
            },

            events: {
                'focus .edit': 'onFocus',
                'blur .edit': 'onBlur',

                'keypress .edit': 'updateOnEnter',
                'keydown .edit': 'revertOnEscape',

                'change .toggle': 'onToggle'
            },

            initialize: function (options) {
                TodosView.__super__.initialize.apply(this, arguments);

                this.listenTo(this.collection, 'change add remove', this.render);

                this.render();
            },

            onFocus: function (evt) {
                $(evt.target).closest('label').addClass('editing');
            },

            onBlur: function (evt) {
                var input = $(evt.target);
                var label = input.closest('label');
                var id = label.attr('data-id');

                var value = input.val();
                var trimmedValue = value.trim();

                if (trimmedValue) {
                    var model = this.collection.get(id);
                    model.save({title: trimmedValue});

                    if (value !== trimmedValue) {
                        model.trigger('change');
                    }
                } else {
                    this.clear(id);
                }

                label.removeClass('editing');
            },

            updateOnEnter: function (evt) {
                if (evt.which === keyCodes.ENTER) {
                    $(evt.target).blur();
                }
            },

            revertOnEscape: function (evt) {
                if (evt.which === keyCodes.ESC) {
                    var target = $(evt.target),
                        label = target.closest('label'),
                        id = label.attr('data-id');

                    label.removeClass('editing');
                    // Also reset the hidden input back to the original value.
                    target.val(this.collection.get(id).get('title'));
                }
            },

            onDestroy: function (evt) {
                var id = $(evt.target).closest('label').attr('data-id');

                this.clear(id);
            },

            onToggle: function (evt) {
                var id = $(evt.target).closest('label').attr('data-id');

                this.collection.get(id).toggleCompleted();
            },

            clear: function (id) {
                this.collection.get(id).destroy();
            }
        });

        return TodosView;
    }
);