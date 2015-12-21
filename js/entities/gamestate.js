bento.define('entities/gamestate', [
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
    return function () {
        var viewport = Bento.getViewport(),
            entity = new Entity({
                z: 0,
                name: '',
                init: function () {}
            });
        return entity;
    };
});