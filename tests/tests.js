(function () {
    var testModules = [
        './suit/UrlProvider.js',
        './suit/detectDomain.js',
        './suit/Abstract.js',
        './suit/Observable.js',
        './suit/ResourceRegistry.js',
        './suit/processRegistry.js',
        './suit/Template.js',
        './suit/Syncer.js',
        './suit/Model.js',
        './suit/Collection.js',
        './suit/View.js'
    ];

    // Resolve all testModules and then start the Test Runner.
    require(testModules, QUnit.start);
}());