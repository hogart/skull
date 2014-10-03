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

                'dblclick label': 'edit',

                'change .toggle': 'onToggle',

                'click .destroy': 'onDestroy'
            },

            initialize: function (options) {
                TodosView.__super__.initialize.apply(this, arguments);

                this.listenTo(this.collection, 'change add remove', this.render);

                this.render();
            },

            render: function () {
                this.rr({todos: this.collection.toTemplate()});
                this.onRender();
            },

            onFocus: function (evt) {
                $(evt.target).closest('li').addClass('editing');
            },

            onBlur: function (evt) {
                var input = $(evt.target);
                var label = input.closest('li');
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
                    var target = $(evt.target);
                    var label = target.closest('li');
                    var id = label.attr('data-id');

                    label.removeClass('editing');
                    // Also reset the hidden input back to the original value.
                    target.val(this.collection.get(id).get('title'));
                }
            },

            edit: function (evt) {
                var li = $(evt.target).closest('li');
                var input = li.find('input.edit');

                li.addClass('editing');
                input.focus();
            },

            onDestroy: function (evt) {
                var id = $(evt.target).closest('li').attr('data-id');

                this.clear(id);
            },

            onToggle: function (evt) {
                var id = $(evt.target).closest('li').attr('data-id');

                this.collection.get(id).toggleCompleted();
            },

            clear: function (id) {
                this.collection.get(id).destroy();
            }
        });

        return TodosView;
    }
);