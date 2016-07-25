bento.define('utils', [
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
    var utils = {
        Layers: {
            /* Add your layer constants here */
            CAMERA: -10,
            BACKGROUND: 0,
            PLAYER: 100,
            GUI: 200
        },
        timeout: function (time, callback, updateWhenPaused) {
            var tween = new Tween({
                from: 0,
                to: 1,
                'in': time,
                ease: 'linear',
                updateWhenPaused: updateWhenPaused,
                onComplete: callback
            });
            return tween;
        }
    };
    Utils.extend(Utils, utils);
    return Utils;
});