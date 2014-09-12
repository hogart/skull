define(
    [
        'Skull',
        './Header',
        './Main',
        './Footer'
    ],
    function (Skull, HeaderView, MainView, FooterView) {
        'use strict';

        var ViewRoot = Skull.View.extend({
            __children__: {
                '#header': HeaderView,
                '#main': MainView,
                '#footer': FooterView
            },

            initialize: function (options) {
                ViewRoot.__super__.initialize.apply(this, arguments);

                this.onRender();
            }
        });

        return ViewRoot;
    }
);