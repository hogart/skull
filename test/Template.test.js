/* eslint-env mocha, browser, jquery */
/* global mocha, chai, Skull */
(function (mocha, assert, Skull) {
    'use strict';

    var Template = Skull.Template;
    var tplNode;

    function createTemplate (name, content) {
        tplNode = $('<script type="text/x-template" class="js-tpl-' + name + '">' + content + '</script>');
        tplNode.appendTo('body');
        return tplNode;
    }

    suite('.Template', function () {
        teardown(function () {
            tplNode.remove();
        });

        test('Finds correct node by template name and throws exception when can\'t do that', function () {
            createTemplate('test', '');
            var template = new Template({}),
                node = template._getTemplateNode('test');

            assert.ok(node.is(tplNode), 'These are the droids we looking for');

            assert.throws(
                function () {
                    template._getTemplateNode('russelsTeapot');
                },
                Error,
                'No such template: "russelsTeapot"',
                'Can\'t find non-existent entity and warns you about that'
            );
        });

        test('Correctly prepares template according to config', function () {
            createTemplate('test', ' testing ');

            var template = new Template({});
            var node = template._getTemplateNode('test');
            var tpl = template._preprocessTemplate(node);

            assert.equal('testing', tpl, 'Trimmed in default config');

            template = new Template({trim: false});
            node = template._getTemplateNode('test');
            tpl = template._preprocessTemplate(node);

            assert.equal(' testing ', tpl, 'Non-trimmed template');
        });

        test('Fetches and compiles template correctly', function () {
            createTemplate('test', '<%= 40 + 2 %>');

            var template = new Template({});
            var node = template._getTemplateNode('test');
            var tpl = template._preprocessTemplate(node);
            var compiled = template._compileTemplate(tpl);

            assert.equal('42', compiled({}), 'Template "<%= 40 + 2 %>" compiled to function returning string "42"');

            var fetchedCompiled = template._getCompiledTemplate('test');

            assert.equal('42', fetchedCompiled({}), 'Template "<%= 40 + 2 %>" fetched and compiled to function returning string "42"');
        });

        test('Caches compiled template according to config', function () {
            createTemplate('test', '<%= 40 + 2 %>');

            var template = new Template({});
            var fetchedBefore = template._getTemplate('test');

            tplNode.text('changed template');
            var fetchedAfter = template._getTemplate('test');

            assert.equal(fetchedBefore({}), fetchedAfter({}), 'Templates cached');

            // clear before next test
            tplNode.remove();
            createTemplate('test', '<%= 40 + 2 %>');

            template = new Template({dontCache: true});
            fetchedBefore = template._getTemplate('test');
            tplNode.text('changed template');
            fetchedAfter = template._getTemplate('test');

            assert.notEqual(fetchedBefore({}), fetchedAfter({}), 'Templates are forced to re-compile each time');
        });

        test(
            '#tmpl returns compiled or rendered template, or calls callback dependent on how many arguments passed',
            function () {
                createTemplate('test', '<%= 40 + 2 %>');

                var template = new Template({});

                var compiled = template.tmpl('test');
                assert.isFunction(compiled, 'Return function with one argument passed');

                var rendered = template.tmpl('test', {});
                assert.equal('42', rendered, 'Return rendered template with two argument passed');

                function cbCompiled(compiledTemplate) {
                    assert.isFunction(compiledTemplate, 'Calls back with compiled template on 3 args, 2nd is falsie');
                }
                template.tmpl('test', null, cbCompiled);

                function cbRendered(renderedTemplate) {
                    assert.equal('42', renderedTemplate, 'Calls back with rendered template on 3 args');
                }
                template.tmpl('test', {}, cbRendered);
            }
        );

        test('Correctly shows debug info', function () {
            var tpl1 = createTemplate('test', '<%= 40 + 2 %>');
            var tpl2 = createTemplate('test', '<%= "64 teeth" %>');
            var template = new Template({debug: true});
            var oldConsole = window.console;

            window.console = {
                warn: function (msg) {
                    assert.ok(msg, 'Prints to console about multiply templates');
                }
            };

            var rendered = template.tmpl('test', {});

            // clean up
            window.console = oldConsole;
            tpl2.remove();

            assert.equal(rendered, '<!-- tpl:test -->\n42\n<!-- /tpl:test -->', 'Surrounds rendered template to debugging comments');

            tpl1.remove();
        });

    });
})(mocha, chai.assert, Skull);