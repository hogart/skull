define(
    function (require) {
        var Skull = require('skull'),
            registry = new Skull.ResourceRegistry,
            passReg = {registry: registry},
            View = Skull.View;

        registry.register('template', new Skull.Template);

        function createTemplate (name, content) {
            var tplNode = $('<script type="text/x-template" class="js-tpl-' + name + '">' + content + '</script>');
            tplNode.appendTo('body');
            return tplNode;
        }

        var viewNest = $('<div style="display: none"></div>').appendTo('body');

        QUnit.module('Skull.View', {
            setup: function () {  },
            teardown: function () {
                $('script[type="text/x-template"]').remove();
                viewNest.html('');
            }
        });

        QUnit.test('Renders correctly', function (QUnit) {
            createTemplate('test1', '<%= 40 + 2 %>');

            var el = $('<div class="js-test1"></div>').appendTo(viewNest);

            var MyView = View.extend({
                tpl: 'test1'
            });

            var view = new MyView(_.extend({}, passReg, {el: el}));
            view.render();

            QUnit.equal(el.html(), '42', 'Renders ok')
        });

        viewNest.remove();
    }
);