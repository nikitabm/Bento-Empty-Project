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
            rectangle = new Rectangle(0, 0, 214, 380);
        ratio = screenWidth / screenHeight;
        rectangle.height = rectangle.width / ratio;
        rectangle.height = Math.min(rectangle.height, 380);
        return rectangle;
    };
});