define(
    [
        'backbone'
    ],
    function (Backbone) {
        'use strict';

        var Router = Backbone.Router.extend({
            routes: {
                '/': 'all',
                '/active': 'active',
                '/completed': 'completed'
            }
        });

        return Router;
    }
);