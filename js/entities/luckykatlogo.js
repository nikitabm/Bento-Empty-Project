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
    'bento/utils',
    'bento/tween'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Entity,
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
                })
            ]
        });
        return entity;
    };
});