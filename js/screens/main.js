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
    'onigiri/onigiri',
    'onigiri/physics',
    'onigiri/rigidbody'
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
    Onigiri,
    Physics,
    RigidBody
) {
    'use strict';
    var onShow = function () {
        // --- Start Onigiri ---
        var onigiri = new Onigiri({
            backgroundColor: '#33ddff',
            camera: {
                cameraStyle: 'perspective',
                perspectiveFieldOfView: 45
            },
            shadows: true
        });
        Bento.objects.attach(onigiri);

        // --- Some Lighting ---
        var sun = new Sun({
            color: '#fff',
            directionalIntensity: 0.2,
            ambientIntensity: 0.8,
            position: new THREE.Vector3(5, 10, 5),
            castShadow: true
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


        // --- Physics ---
        var addFloor = function () {
            var floor = new Onigiri.Primitive({
                shape: 'plane',
                position: new THREE.Vector3(0, 0, 0),
                euler: new THREE.Euler(-Math.PI * 0.5, 0, 0),
                material: new THREE.MeshPhongMaterial({
                    color: 0xe0f9ff,
                    shininess: 100,
                    side: THREE.FrontSide,
                    blending: THREE.NormalBlending
                }),
                parameters: [
                    1000,
                    1000
                ],
                components: [
                    new RigidBody({
                        shape: new Physics.Class('Plane', []),
                        offset: new THREE.Vector3(0, 0, 0),
                        mass: 0
                    })
                ],
                castShadow: false,
                receiveShadow: true
            });
            Bento.objects.attach(floor);
        };
        var addCube = function (x, y, z, scale) {
            var position = new THREE.Vector3(x, y, z);
            var cube = new Onigiri.Primitive({
                shape: 'cube',
                position: position,
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1),
                parameters: [
                    scale, // width
                    scale, // height
                    scale, // depth
                ],
                material: new THREE.MeshStandardMaterial({
                    color: '#ffffff',
                    roughness: 0.5,
                    metalness: 0,
                    transparent: true,
                    opacity: 1,
                    depthWrite: true,
                    side: THREE.FrontSide,
                    blending: THREE.NormalBlending
                }),
                components: [
                    new RigidBody({
                        shape: new Physics.Class('Box', [new Physics.Class('Vec3', [scale * 0.5, scale * 0.5, scale * 0.5])]),
                        offset: new THREE.Vector3(0, 0, 0),
                        mass: 1
                    })
                ],
                castShadow: true,
                recieveShadow: false
            });
            Bento.objects.attach(cube);
            return cube;
        };

        addFloor();
        for (var i = 0; i < 20; i++) {
            for (var j = 0; j < 5; j++) {
                addCube(
                    i * 0.5,
                    (i * 2) + 1, -(j * 2.1) + (i % 2 === 0 ? 0.9 : 0),
                    2
                );
            }
        }
    };

    return new Screen({
        onShow: onShow,
        onHide: Physics.cleanWorld
    });
});