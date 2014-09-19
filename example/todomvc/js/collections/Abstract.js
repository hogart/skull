define(
    [
        'Skull',
        'StorageSyncer',
        'underscore'
    ],

    function (Skull, StorageSyncer, _) {
        'use strict';

        var CollectionAbstract = Skull.Collection.extend({
            __registry__: function () {
                var reg = this._parentResult(CollectionAbstract, '__registry__');
                reg.syncer = ['syncer', {name: _.result(this, 'resource')}];

                return reg;
            }
        });

        return CollectionAbstract;
    }
);