/* eslint-env mocha, browser, jquery */
/* global mocha, chai, Skull, _ */
(function (mocha, assert, Skull) {
    'use strict';

    var registry = new Skull.ResourceRegistry();
    var passReg = {registry: registry};
    var View = Skull.View;

    registry.register('template', new Skull.Template());

    function createTemplate (name, content) {
        var tplNode = $('<script type="text/x-template" class="js-tpl-' + name + '">' + content + '</script>');
        tplNode.appendTo('body');
        return tplNode;
    }

    var viewNest = $('<div style="display: none"></div>').appendTo('body');

    suite('.View', function () {
        teardown(function () {
            $('script[type="text/x-template"]').remove();
            viewNest.html('');
        });

        suite('Renders correctly', function () {
            test('Static template', function () {
                createTemplate('staticTpl', '<%= 40 + 2 %>');

                var el = $('<div class="js-test1"></div>').appendTo(viewNest);
                var StaticView = View.extend({
                    tpl: 'staticTpl'
                });
                var staticView = new StaticView(_.extend({}, passReg, {el: el}));

                staticView.render();

                assert.equal(el.html(), '42', '');
            });

            test('Passing data to template', function () {
                createTemplate('dataTpl', '<%= a + b %>');

                var el = $('<div class="js-test2"></div>').appendTo(viewNest);
                var DataView = View.extend({
                    tpl: 'dataTpl'
                });
                var data = {
                    a: 40,
                    b: 2
                };

                var dataView = new DataView(_.extend({}, passReg, {el: el, model: data}));
                dataView.render();

                assert.equal(el.html(), '42');
            });

            test('Calling .toTemplate method', function () {
                createTemplate('modelTpl', '<%= a + b %>');

                var el = $('<div class="js-test3"></div>').appendTo(viewNest);
                var ModelView = View.extend({
                    tpl: 'modelTpl'
                });
                var model = {
                    toTemplate: function () {
                        return {a: 40, b: 2};
                    }
                };
                var modelView = new ModelView(_.extend({}, passReg, {el: el, model: model}));

                modelView.render();

                assert.equal(el.html(), '42');
            });
        });

        suite('Replaces this.$el, when told so', function () {
            setup(function () {
                createTemplate('replace', '<div class="js-replacer"></div>');
            });

            test('Replaced entire element as intended', function () {
                var el = $('<div class="js-test1"></div>').appendTo(viewNest);
                var ReplacingView = View.extend({
                    tpl: 'replace',
                    replaceEl: true
                });
                var rView = new ReplacingView(_.extend({}, passReg, {el: el}));

                rView.render();

                assert.ok(rView.$el.hasClass('js-replacer'));
            });

            test('Replaced only content', function () {
                var el = $('<div class="js-test2"></div>').appendTo(viewNest);
                var SimpleView = View.extend({
                    tpl: 'replace',
                    replaceEl: false
                });
                var sView = new SimpleView(_.extend({}, passReg, {el: el}));

                sView.render();

                assert.ok(sView.$('.js-replacer').length);
            });
        });
    });
})(mocha, chai.assert, Skull);