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
            directionalIntensity: 0.2,
            ambientIntensity: 0.8,
            position: new THREE.Vector3(5, 10, 5)
        });
        Bento.objects.attach(sun);

        // --- Infinite Floor Plane ---
        var floor = new Onigiri.Primitive({
            shape: 'plane',
            position: new THREE.Vector3(0, -0.2, 0),
            euler: new THREE.Euler(-Math.PI * 0.5, 0, 0),
            material: new THREE.MeshPhongMaterial({
                color: 0xe0f9ff,
                shininess: 100,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending
            }),
            parameters: [
                10000,
                10000
            ]
        });
        Bento.objects.attach(floor);

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