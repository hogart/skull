define(
    [
        'Skull',
        'keyCodes',
        'underscore'
    ],

    function (Skull, keyCodes, _) {
        'use strict';

        var HeaderView = Skull.View.extend({
            __registry__: function () {
                var reg = this._parentResult(HeaderView, '__registry__');
                return _.extend({}, reg, {
                    collection: 'todosCollection'
                });
            },

            events: {
                'keypress $titleInput': 'createOnEnter'
            },

            __ui__: {
                titleInput: '#new-todo'
            },

            initialize: function (options) {
                HeaderView.__super__.initialize.apply(this, arguments);
                this.onRender();
            },

            createOnEnter: function (evt) {
                var title;
                if (evt.which === keyCodes.ENTER && (title = this.ui.titleInput.val().trim())) {
                    this.collection.create({
                        title: title
                    }).save({});

                    this.ui.titleInput.val('');
                }
            }
        });

        return HeaderView;
    }
);