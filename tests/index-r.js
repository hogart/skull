(function () {

    // Defer Qunit so RequireJS can work its magic and resolve all modules.
//    QUnit.config.autostart = false;

    // A list of all QUnit test Modules.  Make sure you include the `.js` 
    // extension so RequireJS resolves them as relative paths rather than using
    // the `baseUrl` value supplied above.
    var testModules = [
        '/tests/UrlProvider.js',
        '/tests/detectDomain.js',
        '/tests/Abstract.js',
        '/tests/Observable.js',
        '/tests/ResourceRegistry.js',
        '/tests/processRegistry.js'

    ];

    // Resolve all testModules and then start the Test Runner.
    require(testModules, QUnit.start);
}());