/**
 * Screen description
 */
bento.define('screens/preloader', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/components/fill',
    'bento/gui/text',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/screen',
    'bento/tween',
    'entities/luckykatlogo',
    'globals'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Fill,
    Text,
    Entity,
    EventSystem,
    Utils,
    Screen,
    Tween,
    LuckyKat,
    Globals
) {
    'use strict';
    var onShow = function () {
        /* Screen starts here */
        var viewport = Bento.getViewport();
        var loaded = false;
        var background = new Entity({
            z: 0,
            name: 'background',
            components: [
                new Fill({})
            ]
        });
        var luckyKat = new LuckyKat({});
        var text = Text({
            z: 1,
            name: 'loadingText',
            font: 'font',
            fontSize: 12,
            fontColor: '#fff',
            text: '',
            align: 'left',
            textBaseline: 'top',
            position: new Vector2(0, 0)
        });
        var end = function () {
            if (loaded) {
                Bento.screens.show('screens/main');
            }
        };
        var loadFonts = function () {
            var fonts = Bento.assets.getAssetGroups().preloader.fonts;
            var font;
            if (!fonts) {
                return;
            }
            for (font in fonts) {
                if (!fonts.hasOwnProperty(font)) {
                    continue;
                }
                new Text({
                    position: new Vector2(1000, 1000),
                    text: '.',
                    font: font
                });
            }
        };

        Bento.objects.attach(background);
        Bento.objects.attach(text);
        Bento.objects.attach(luckyKat);

        // preload fonts
        loadFonts();

        // hide cordova splashscreen if exists
        if (navigator.splashscreen) {
            navigator.splashscreen.hide();
        }

        Bento.assets.loadAllAssets({
            exceptions: ['preloader'], // preloader was already loaded
            onLoaded: function (current, total) {
                // show how many assets still to be loaded
                if (Utils.isCocoonJS()) {
                    return;
                }
                text.setText('Loading ' + current + '/' + total);
            },
            onReady: function () {
                console.log('All assets loaded');
                loaded = true;
                end();
            }
        });
    };

    return new Screen({
        onShow: onShow
    });
});