/**
 * Initialization of system and cordova modules
 */
bento.define('init', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/tween',
    'bento/eventsystem',
    'utils',
    'modules/localization'
], function (
    Bento,
    Vector2,
    Rectangle,
    Tween,
    EventSystem,
    Utils,
    Localization
) {
    'use strict';
    return function () {
        /**
         * Init localization
         */
        var initLocalization = function () {
            // find system language (language is set in preloader screen)
            Localization.init();

            // clean unused language assets (note: this means you cannot change language after startup)
            if (!Bento.isDev()) {
                Localization.cleanUnusedAssets();
            }
        };
        /**
         * Input safety
         */
        var inputSafety = function () {
            EventSystem.on('touchcancel', Bento.input.resetPointers);
        };

        initLocalization();
        inputSafety();

        /**
         * Start preloader
         */
        Bento.assets.load('preloader', function (err) {
            Bento.screens.show('screens/preloader');
        });
    };
});