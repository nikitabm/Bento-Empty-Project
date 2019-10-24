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
    'onigiri/physics'
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
                castShadow: false,
                receiveShadow: true
            });
            Physics.addBody({
                id: floor.id,
                shape: new Physics.CannonClass('Plane', []),
                mass: 0,
                position: Physics.threeToCannon(floor.position),
                quaternion: Physics.threeToCannon(floor.quaternion)
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
                castShadow: true,
                recieveShadow: false
            });
            Physics.addBody({
                id: cube.id,
                shape: new Physics.CannonClass('Box', [new Physics.CannonClass('Vec3', [scale * 0.5, scale * 0.5, scale * 0.5])]),
                mass: scale * scale * scale * 0.1,
                position: Physics.threeToCannon(cube.position),
                quaternion: Physics.threeToCannon(cube.quaternion)
            }, function () {
                Bento.objects.attach(cube);
            });
            return cube;
        };

        var addCannonBall = function (x, y, z, scale) {
            var position = new THREE.Vector3(x, y, z);
            var cube = new Onigiri.Primitive({
                shape: 'sphere',
                position: position,
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1),
                parameters: [
                    scale,
                    12, // height
                    12, // depth
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
                castShadow: true,
                recieveShadow: false
            });
            Physics.addBody({
                id: cube.id,
                shape: new Physics.CannonClass('Sphere', [scale]),
                mass: (4 / 3) * Math.PI * (scale * scale * scale),
                position: Physics.threeToCannon(cube.position),
                quaternion: Physics.threeToCannon(cube.quaternion),
                velocity: Physics.threeToCannon(new THREE.Vector3(0, 0, -60)),
            }, function () {
                Bento.objects.attach(cube);
            });
            return cube;
        };

        var physicsController = new Entity({
            name: 'physicsController',
            components: [{
                    name: 'physicsControllerBehaviour',
                    start: function () {
                        Physics.init({
                            solver: {
                                iterations: 5,
                                tolerance: 0.01
                            }
                        }, function () {
                            addFloor();
                            for (var i = 0; i < 5; i++) {
                                for (var j = 0; j < 40; j++) {
                                    addCube(
                                        0,
                                        (i * 2) + 1, -(j * 2.1) + (i % 2 === 0 ? 0.9 : 0),
                                        2
                                    );
                                }
                            }
                        });
                    },
                    update: function () {
                        Physics.update({});
                    },
                    destroy: function () {
                        Physics.destroy({});
                    }
                },
                new Clickable({
                    pointerDown: function (data) {
                        var cannonBall = addCannonBall(
                            0,
                            5,
                            10,
                            3
                        );
                    }
                })
            ]
        });
        Bento.objects.attach(physicsController);
    };

    return new Screen({
        onShow: onShow
    });
});