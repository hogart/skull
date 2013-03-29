define(
    function (require) {
        var Template = require('skull').Template,
            tplNode;

        function createTemplate (name, content) {
            tplNode = $('<script type="text/x-template" class="js-tpl-' + name + '">' + content + '</script>');
            tplNode.appendTo('body');
            return tplNode;
        }

        QUnit.module('Skull.Template', {
//            setup: function () {  },
            teardown: function () { tplNode.remove() }
        });

        QUnit.test('Finds correct node by template name and throws exception when can\'t do that', function (QUnit) {
            createTemplate('test', '');
            var template = new Template({}),
                node = template._getTemplateNode('test');

            QUnit.ok(node.is(tplNode), 'These are the droids we looking for');

            QUnit.throws(
                function () {
                    template._getTemplateNode('russelsTeapot')
                },
                Error,
                'Can\'t find non-existent entity and warns you about that'
            );
        });

        QUnit.test('Correctly prepares template according to config', function (QUnit) {
            createTemplate('test', ' testing ');

            var template = new Template({}),
                node = template._getTemplateNode('test'),
                tpl = template._preprocessTemplate(node);

            QUnit.equal('testing', tpl, 'Trimmed in default config');

            template = new Template({trim: false});
            node = template._getTemplateNode('test');
            tpl = template._preprocessTemplate(node);

            QUnit.equal(' testing ', tpl, 'Non-trimmed template');
        });

        QUnit.test('Fetches and compiles template correctly', function (QUnit) {
            createTemplate('test', '<%= 40 + 2 %>');

            var template = new Template({}),
                node = template._getTemplateNode('test'),
                tpl = template._preprocessTemplate(node),
                compiled = template._compileTemplate(tpl);

            QUnit.equal('42', compiled({}), 'Template "<%= 40 + 2 %>" compiled to function returning string "42"');

            var fetchedCompiled = template._getCompiledTemplate('test');

            QUnit.equal('42', fetchedCompiled({}), 'Template "<%= 40 + 2 %>" fetched and compiled to function returning string "42"');
        });

        QUnit.test('Caches compiled template according to config', 3, function (QUnit) {
            createTemplate('test', '<%= 40 + 2 %>');

            var template = new Template({}),
                fetchedBefore = template._getTemplate('test');

            QUnit.equal(template._templates['test']({}), '42', 'Templates are correctly stored internally');

            tplNode.text('changed template');
            var fetchedAfter = template._getTemplate('test');

            QUnit.equal(fetchedBefore({}), fetchedAfter({}), 'Templates cached');

            // clear before next test
            tplNode.remove();
            createTemplate('test', '<%= 40 + 2 %>');

            template = new Template({dontCache: true});
            fetchedBefore = template._getTemplate('test');
            tplNode.text('changed template');
            fetchedAfter = template._getTemplate('test');

            QUnit.notEqual(fetchedBefore({}), fetchedAfter({}), 'Templates are forced to re-compile each time');
        });

        QUnit.test(
            '#tmpl returns compiled or rendered template, or calls callback dependent on how many arguments passed',
            4,
            function (QUnit) {
                createTemplate('test', '<%= 40 + 2 %>');

                var template = new Template({});

                var compiled = template.tmpl('test');
                QUnit.equal('function', typeof compiled, 'Return function with one argument passed');

                var rendered = template.tmpl('test', {});
                QUnit.equal('42', rendered, 'Return rendered template with two argument passed');

                function cbCompiled(template) {
                    QUnit.equal('function', typeof template, 'Calls back with compiled template on 3 args, 2nd is falsie');
                }
                template.tmpl('test', null, cbCompiled);

                function cbRendered(rendered) {
                    QUnit.equal('42', rendered, 'Calls back with rendered template on 3 args');
                }
                template.tmpl('test', {}, cbRendered);
            }
        );

        QUnit.test('Correctly shows debug info', 2, function (QUnit) {
            var tpl1 = createTemplate('test', '<%= 40 + 2 %>'),
                tpl2 = createTemplate('test', '<%= "64 teeth" %>'),
                template = new Template({debug: true}),
                oldConsole = window.console;

            window.console = {
                warn: function (msg) {
                    QUnit.ok(msg, 'Prints to console about multiply templates')
                }
            };

            var rendered = template.tmpl('test', {});

            // clean up
            window.console = oldConsole;
            tpl2.remove();

            QUnit.equal(rendered, '<!-- tpl:test -->\n42\n<!-- /tpl:test -->', 'Surrounds rendered template to debugging comments');

            tpl1.remove();
        });
    }
);