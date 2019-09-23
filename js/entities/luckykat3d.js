/**
 * An entity that holds and manipulates a mesh
 * @moduleName LuckyKat3d
 */
bento.define('entities/luckykat3d', [
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
    'bento/tween',
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
    Tween,
    Onigiri
) {
    'use strict';
    return function (settings) {
        // --- Variables ---
        var mesh = Onigiri.getMesh('luckykat');
        mesh.children[1].material.emissiveIntensity = 0; // why is this enabled by default?

        // --- Components ---
        var controls = new Onigiri.ClickCaster({
            raycastMesh: mesh.children[1],
            pointerDownCast: function (castData) {
                if (castData) {
                    new Tween({
                        from: 0.25,
                        to: 0,
                        in: 60,
                        ease: 'elastic',
                        decay: 5,
                        oscillations: 3,
                        onUpdate: function (v, t) {
                            mesh.scale.x = 1 + v;
                            mesh.scale.z = 1 + v;
                            mesh.scale.y = 1 - v;
                        }
                    });
                }
            }
        });

        // --- Entity ---
        var entity = new Onigiri.Entity3D({
            name: 'luckyKat3d',
            family: [''],
            object3D: mesh,
            position: new THREE.Vector3(0, 0, 0),
            euler: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            components: [
                new Onigiri.AnimationMixer({
                    defaultAnimation: 'idle'
                }),
                controls
            ]
        });

        return entity;
    };
});