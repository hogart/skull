(function () {
    var testModules = [
        '/tests/suit/UrlProvider.js',
        '/tests/suit/detectDomain.js',
        '/tests/suit/Abstract.js',
        '/tests/suit/Observable.js',
        '/tests/suit/ResourceRegistry.js',
        '/tests/suit/processRegistry.js',
        '/tests/suit/Template.js',
        '/tests/suit/Syncer.js',
        '/tests/suit/Model.js'


    ];

    // Resolve all testModules and then start the Test Runner.
    require(testModules, QUnit.start);
}());