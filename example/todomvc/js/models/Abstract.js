define(
    [
        'Skull',
        'StorageSyncer',
        'underscore'
    ],

    function (Skull, StorageSyncer, _) {
        'use strict';

        var ModelAbstract = Skull.Model.extend({
            __registry__: function () {
                var reg = this._parentResult(ModelAbstract, '__registry__');
                reg.syncer = ['syncer', {name: _.result(this, 'resource')}];

                return reg;
            }
        });

        return ModelAbstract;
    }
);