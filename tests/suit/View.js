define(
    function (require) {
        var Skull = require('skull'),
            registry = new Skull.ResourceRegistry,
            passReg = {registry: registry},
            View = Skull.View;

        registry.register('template', new Skull.Template);

        function createTemplate(name, content) {
            var tplNode = $('<script type="text/x-template" class="js-tpl-' + name + '">' + content + '</script>');
            tplNode.appendTo('body');
            return tplNode;
        }

        var viewNest = $('<div style="display: none"></div>').appendTo('body');

        QUnit.module('Skull.View', {
            setup: function () {
            },
            teardown: function () {
                $('script[type="text/x-template"]').remove();
                viewNest.html('');
            }
        });

        QUnit.test('Renders correctly', function (QUnit) {
            // static template view
            createTemplate('staticTpl', '<%= 40 + 2 %>');

            var el = $('<div class="js-test1"></div>').appendTo(viewNest);

            var StaticView = View.extend({
                tpl: 'staticTpl'
            });

            var staticView = new StaticView(_.extend({}, passReg, {el: el}));
            staticView.render();

            QUnit.equal(el.html(), '42', 'Static template');


            // data view
            createTemplate('dataTpl', '<%= a + b %>');
            el = $('<div class="js-test2"></div>').appendTo(viewNest);

            var DataView = View.extend({
                    tpl: 'dataTpl'
                }),
                data = {
                    a: 40,
                    b: 2
                };

            var dataView = new DataView(_.extend({}, passReg, {el: el, model: data}));
            dataView.render();

            QUnit.equal(el.html(), '42', 'Data to template passing');


            // model or collection view
            createTemplate('modelTpl', '<%= a + b %>');
            el = $('<div class="js-test3"></div>').appendTo(viewNest);

            var ModelView = View.extend({
                    tpl: 'modelTpl'
                }),
                model = {
                    toTemplate: function () {
                        return {a: 40, b: 2}
                    }
                };

            var modelView = new ModelView(_.extend({}, passReg, {el: el, model: model}));
            modelView.render();

            QUnit.equal(el.html(), '42', 'Calling .toTemplate method');
        });

        viewNest.remove();
    }
);