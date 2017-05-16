/**
 * Extends utils with more useful functions.
 * See bento/utils
 */
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
        /**
         * Wrapper for tweens to simulate a timeout
         */
        timeout: function (time, callback) {
            var tween = new Tween({
                from: 0,
                to: 1,
                in: time,
                ease: 'linear',
                onComplete: callback
            });
            return tween;
        }
    };
    Utils.extend(Utils, utils);
    return Utils;
});