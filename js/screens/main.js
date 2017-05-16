/**
 * Main screen
 */
bento.define('screens/main', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
    'bento/eventsystem',
    'bento/gui/clickbutton',
    'bento/gui/counter',
    'bento/gui/text',
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
    Entity,
    EventSystem,
    ClickButton,
    Counter,
    Text,
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
        var background = new Entity({
            z: 0,
            name: 'background',
            position: new Vector2(viewport.width / 2, viewport.height / 2),
            originRelative: new Vector2(0.5, 0.5),
            components: [
                new Sprite({
                    imageName: 'background'
                })
            ]
        });
        var luckyKat = new LuckyKat({});

        Bento.objects.attach(background);
        Bento.objects.attach(luckyKat);
    };

    return new Screen({
        onShow: onShow
    });
});