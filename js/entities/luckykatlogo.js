/**
 * Lucky Kat logo
 * @moduleName LuckyKatLogo
 * @snippet LuckyKatLogo.snippet
LuckyKatLogo({})
 */
bento.define('entities/luckykatlogo', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
    'bento/gui/clickbutton',
    'bento/gui/counter',
    'bento/gui/text',
    'bento/eventsystem',
    'bento/utils',
    'bento/tween'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Entity,
    ClickButton,
    Counter,
    Text,
    EventSystem,
    Utils,
    Tween
) {
    'use strict';
    return function (settings) {
        var viewport = Bento.getViewport();
        var entity = new Entity({
            z: 1,
            name: 'luckyKatLogo',
            position: new Vector2(viewport.width / 2, viewport.height / 2),
            components: [
                new Sprite({
                    imageName: 'luckykat-160',
                    originRelative: new Vector2(0.5, 0.5)
                }),
                new Clickable({
                    onClick: function (data) {
                        // bounce when user click on the lucky cat
                        new Tween({
                            from: 0.25,
                            to: 0,
                            in: 60,
                            ease: 'elastic',
                            decay: 5,
                            oscillations: 3,
                            onUpdate: function (v, t) {
                                entity.scale.x = 1 + v;
                                entity.scale.y = 1 - v;
                            }
                        });
                    }
                })
            ]
        });
        return entity;
    };
});