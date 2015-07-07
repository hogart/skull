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

        suite('__ui__ and macros in selectors', function () {
            var el;

            setup(function () {
                createTemplate(
                    'macrosTpl',
                    '<div class="js-node">' +
                    '    <div class="js-node-inner">' +
                    '        <button class="js-node-inner-sanctum"></button>' +
                    '    </div>' +
                    '    <div class="js-node-other"></div>' +
                    '</div>'
                );
                el = $('<div class="js-test4"></div>').appendTo(viewNest);
            });

            var BasicMacroView = View.extend({
                tpl: 'macrosTpl',
                __ui__: {
                    root: '.js-node',
                    inner: '$root-inner',
                    btn: '$inner-sanctum',
                    other: '$root-other'
                }
            });

            test('Substitutes macros in __ui__', function () {
                var macroView = new BasicMacroView(_.extend({}, passReg, {el: el}));

                macroView.render();

                assert.instanceOf(macroView.ui.inner[0], Node, 'One level unfolded ok');
                assert.instanceOf(macroView.ui.btn[0], Node, 'Two levels unfolded ok');
            });

            test('Substitutes macros in events', function () {
                var clicked = false;
                var EventsMacroView = BasicMacroView.extend({
                    events: {
                        'click $btn': 'onBtnClick'
                    },
                    onBtnClick: function () {
                        clicked = true;
                    }
                });

                var eventsView = new EventsMacroView(_.extend({}, passReg, {el: el}));

                eventsView.render();

                eventsView.ui.btn.click();
                assert.ok(clicked, 'Macros unfolded in events hash');
            });

            test('Substitutes macros in __children__', function () {
                var OtherView = View.extend({});
                var NestedMacroView = BasicMacroView.extend({
                    __children__: {
                        $other: OtherView
                    }
                });

                var nestedView = new NestedMacroView(_.extend({}, passReg, {el: el}));

                nestedView.render();

                assert.property(nestedView.children, '$other', 'Child view was created and assigned according to unfolded selector');
                assert.lengthOf(nestedView.children.$other.$el, 1, 'Child view is attached to actual DOM element');
            });
        });

        suite('re-rendering', function () {
            var el;
            var RerenderView = View.extend({
                tpl: 'rerenderTemplate',
                initialize: function (options) {
                    RerenderView.__super__.initialize.call(this, options);
                    this.btnCounter = 0;
                    this.elCounter = 0;
                },
                __ui__: {
                    btn: 'button'
                },
                events: {
                    'click button': 'onBtnClick',
                    'click': 'onElClick'
                },
                onBtnClick: function (event) {
                    event.stopPropagation(); // or else this will trigger onElClick handler too
                    this.btnCounter++;
                },
                onElClick: function () {
                    this.elCounter++;
                }
            });
            var RerenderReplacingView = RerenderView.extend({
                replaceEl: true
            });

            setup(function () {
                createTemplate(
                    'rerenderTemplate',
                    '<div>' +
                        '<button>ᏍᏏᏆᏱ</button>' +
                    '</div>'
                );
                el = $('<div class="js-test5"></div>').appendTo(viewNest);
            });

            test('correctly handles re-rendering when not replacing $el', function () {
                var rView = new RerenderView(_.extend({}, passReg, {el: el}));
                rView.render();

                rView.ui.btn.click();
                assert.equal(rView.btnCounter, 1, 'button counter ok');

                rView.$el.click();
                assert.equal(rView.elCounter, 1, '$el counter ok');

                rView.render();
                rView.render();

                rView.ui.btn.click();
                assert.equal(rView.btnCounter, 2, 'button counter ok after render called several times');

                rView.$el.click();
                assert.equal(rView.elCounter, 2, '$el counter ok after render called several times');
            });

            test('correctly handles re-rendering when replacing $el', function () {
                var rrView = new RerenderReplacingView(_.extend({}, passReg, {el: el}));
                rrView.render();

                rrView.ui.btn.click();
                assert.equal(rrView.btnCounter, 1, 'button counter ok');

                rrView.$el.click();
                assert.equal(rrView.elCounter, 1, '$el counter ok');

                rrView.render();
                rrView.render();

                rrView.ui.btn.click();
                assert.equal(rrView.btnCounter, 2, 'button counter ok after render called several times');

                rrView.$el.click();
                assert.equal(rrView.elCounter, 2, '$el counter ok after render called several times');
            });
        });
    });
})(mocha, chai.assert, Skull);