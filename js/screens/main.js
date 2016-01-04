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
    'bento/screen',
    'entities/background'
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
    Screen,
    Background
) {
    'use strict';
    var object = new Screen({
        dimension: Bento.getViewport()
    });
    Utils.extend(object, {
        onShow: function () {
            var viewport = Bento.getViewport(),
                background = new Background();
            Bento.objects.attach(background);

        }
    });
    return object;
});