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
    'modules/physics'
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
    Physics
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

        // --- Da Lucky Kat ---
        var luckyKat3d = LuckyKat3d({});
        //Bento.objects.attach(luckyKat3d);

        // --- Camera ---
        var camera360 = new Camera360({
            target: luckyKat3d.object3D
        });
        Bento.objects.attach(camera360);


        // --- Physics ---
        var addFloor = function () {
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
            Physics.addBody({
                id: floor.id,
                shape: {
                    type: 'Plane',
                    arguments: []
                },
                mass: 0,
                position: floor.position,
                quaternion: floor.quaternion
            });
            Bento.objects.attach(floor);
        };
        var addCube = function () {
            var position = new THREE.Vector3(0, 10, 0);
            var cube = new Onigiri.Primitive({
                shape: 'cube',
                position: position,
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1),
                parameters: [
                    1, // width
                    1, // height
                    1, // depth
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
            });
            Physics.addBody({
                id: cube.id,
                shape: {
                    type: 'Box',
                    arguments: [new CANNON.Vec3(0.1, 0.1, 0.1)]
                },
                mass: 1,
                position: position
            });
            Bento.objects.attach(cube);
        };

        var physicsController = new Entity({
            name: 'physicsController',
            components: [{
                name: 'physicsControllerBehaviour',
                start: function () {
                    Physics.init({});
                },
                update: function () {
                    if (physicsController.ticker === 60) {
                        addFloor();
                        addCube();
                    }
                    Physics.update({});
                },
                destroy: function () {
                    Physics.destroy({});
                }
            }]
        });
        Bento.objects.attach(physicsController);
    };

    return new Screen({
        onShow: onShow
    });
});