bento.define('autoresize', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
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
    EventSystem,
    Utils,
    Tween
) {
    'use strict';
    return function () {
        var screenWidth = window.innerWidth * window.devicePixelRatio,
            screenHeight = window.innerHeight * window.devicePixelRatio,
            ratio,
            rectangle = Rectangle(0, 0, 380, 214);

        // get ratio
        ratio = screenWidth / screenHeight;
        if (ratio < 1) {
            ratio = 1 / ratio;
        }
        ratio = Math.min(ratio, 1.78);

        rectangle.width = ratio * rectangle.height;
        return rectangle;
    };
});