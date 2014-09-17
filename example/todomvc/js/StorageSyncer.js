define(
    [
        'Skull',
        'underscore'
    ],
    function (Skull, _) {
        'use strict';

        var StorageSyncer = Skull.Syncer.extend({
            ajax: function (params) { //TODO: rewrite with $.Deferred
                var url = params.url,
                    success = params.success,
                    error = params.error,
                    status = 200,
                    thrown,
                    isError = false,
                    response,
                    rawResponse;

                if (!(url in localStorage) && (params.type !== 'POST')) {
                    status = 404;
                } else {
                    if (params.type === 'GET') { // read
                        try {
                            rawResponse = JSON.parse(localStorage.getItem(url));
                        } catch (exception) {
                            status = 500;
                            thrown = exception;
                            isError = true;
                        }
                        if (!isError) {
                            response = rawResponse;
                            status = 200;
                        }
                    } else if (params.type === 'POST') { // create
                        try {
                            localStorage.setItem(url, params.data);
                        } catch (exception) {
                            status = 500;
                            thrown = exception;
                            isError = true;
                        }
                        if (!isError) {
                            response = params.data;
                        }
                    } else if (params.type === 'PUT' || params.type === 'PATCH') { // update
                        var data = _.extend(JSON.parse(localStorage.getItem(url)), params.data);

                        try {
                            localStorage.setItem(url, data);
                        } catch (exception) {
                            status = 500;
                            thrown = exception;
                            isError = true;
                        }
                        if (!isError) {
                            response = params.data;
                        }
                    } else if (params.type === 'DELETE') {
                        localStorage.removeItem(url);
                        response = null;
                    }
                }


                if (isError) {
                    setTimeout(function () {
                        error(null, status, thrown);
                    });
                } else {
                    setTimeout(function () {
                        success(response, status, null);
                    });
                }
            }
        });

        return StorageSyncer;
    }
);