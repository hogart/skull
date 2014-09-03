define(
    [
        'Skull'
    ],
    function (Skull) {
        'use strict';

        var ViewRoot = Skull.View.extend({
            __children__: {
                '#header': HeaderView,
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