/**
 * Initialization of system and cordova modules
 */
bento.define('init', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/tween',
    'bento/eventsystem',
    'utils'
], function (
    Bento,
    Vector2,
    Rectangle,
    Tween,
    EventSystem,
    Utils
) {
    'use strict';
    return function () {
        /**
         * Clears screen with black every tick (android only)
         */
        var clearScreen = function () {
            var canvasDimension = Bento.getViewport();
            var clear = function (data) {
                data.renderer.begin();
                data.renderer.fillRect([0, 0, 0, 1], 0, 0, canvasDimension.width, canvasDimension.height);
                data.renderer.flush();
            };
            if (Utils.isNativeAndroid()) {
                EventSystem.on('preDraw', clear);
            }
        };
        /**
         * Turn off antialiasing for pixel art
         */
        var antiAliasing = function () {
            if (Utils.isCocoonJS() && window.Cocoon) {
                window.Cocoon.Utils.setAntialias(false);
            }
        };

        clearScreen();
        antiAliasing();

        /**
         * Start preloader
         */
        Bento.assets.load('preloader', function (err) {
            Bento.screens.show('screens/preloader');
        });
    };
});