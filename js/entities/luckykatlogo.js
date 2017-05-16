/**
 * Lucky Kat logo
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
        /*settings = {
            // describe your settings object parameters
            position: Vector2 // positions the entity
        }*/
        var viewport = Bento.getViewport();
        var entity = new Entity({
            z: 1,
            name: 'luckyKatLogo',
            position: new Vector2(viewport.width / 2, viewport.height / 2),
            boundingBox: new Rectangle(-80, -80, 160, 160),
            components: [
                new Sprite({
                    imageName: 'luckykat-160',
                    originRelative: new Vector2(0.5, 0.5)
                })
            ]
        });
        return entity;
    };
});