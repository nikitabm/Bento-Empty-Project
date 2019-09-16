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
    'globals',
    'entities/luckykat3d',
    'components/sun',
    'entities/camera360',
    'onigiri/onigiri'
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
    Globals,
    LuckyKat3d,
    Sun,
    Camera360,
    Onigiri
) {
    'use strict';
    var onShow = function () {
        // --- Start Onigiri ---
        new Onigiri({
            backgroundColor: '#33ddff',
            cameraFieldOfView: 45
        });

        // --- Some Lighting ---
        var sun = new Sun({
            color: '#fff',
            directionalIntensity: 0.25,
            ambientIntensity: 0.3,
            targetPosition: new THREE.Vector3(-5, -10, -5)
        });
        Bento.objects.attach(sun);

        // --- Da Lucky Kat ---
        var luckyKat3d = LuckyKat3d({});
        Bento.objects.attach(luckyKat3d);

        // --- Camera ---
        var camera360 = new Camera360({
            target: luckyKat3d.object3D
        });
        Bento.objects.attach(camera360);
    };

    return new Screen({
        onShow: onShow
    });
});