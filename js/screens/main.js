bento.define('screens/main', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/components/fill',
    'bento/entity',
    'bento/utils',
    'bento/tween',
    'bento/screen'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Fill,
    Entity,
    Utils,
    Tween,
    Screen
) {
    'use strict';
    var object = Screen({
        dimension: Bento.getViewport()
    });
    Utils.extend(object, {
        onShow: function () {
            var viewport = Bento.getViewport();
            
        }
    });
    return object;
});