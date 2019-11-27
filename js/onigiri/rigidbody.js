/**
 * Component description
 * @moduleName RigidBody
 * @snippet RigidBody.snippet
RigidBody({
    shape: new Physics.Class('Box', [new Physics.Class('Vec3', [1, 1, 1])]),
    offset: new THREE.Vector3(0, 0, 0)
})
 */
bento.define('onigiri/rigidbody', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/tween',
    'onigiri/physics',
    'onigiri/onigiri'
], function (
    Bento,
    Vector2,
    Rectangle,
    Entity,
    EventSystem,
    Utils,
    Tween,
    Physics,
    Onigiri
) {
    'use strict';
    var RigidBody = function (settings) {
        // --- Parameters ---
        var shape = settings.shape || new Physics.Class('Box', [new Physics.Class('Vec3', [1, 1, 1])]);
        var mass = settings.mass || 0;
        var offset = settings.offset || new THREE.Vector3(0, 0, 0);
        var rotationOffset = settings.rotationOffset || new THREE.Quaternion(0, 0, 0, 1);
        var allowSleep = Utils.getDefault(settings.allowSleep, true);
        var sleepSpeedLimit = Utils.getDefault(settings.sleepSpeedLimit, 0.01);
        var sleepTimeLimit = Utils.getDefault(settings.sleepTimeLimit, 5);
        var onStart = settings.onStart;

        // --- Vars ---
        var bodyAdded = false;
        var entity;
        var bId;

        // --- Component ---
        var component = {
            name: settings.name || 'rigidBody',
            start: function () {
                if (bId && shape) {
                    Physics.addBody({
                        bId: bId,
                        shape: shape,
                        mass: mass,
                        allowSleep: allowSleep,
                        sleepSpeedLimit: sleepSpeedLimit,
                        sleepTimeLimit: sleepTimeLimit,
                        position: Physics.T2C(entity.position),
                        quaternion: Physics.T2C(entity.quaternion),
                        shapeOffsets: [Physics.T2C(offset)],
                        shapeOrientations: [Physics.T2C(rotationOffset)]
                    });
                    if (onStart) {
                        onStart();
                    }
                    bodyAdded = true;
                }
            },
            modifyProperty: function (property, operator, value, callback) {
                Physics.modifyBodyProperty({
                    bId: bId,
                    property: property,
                    operator: operator,
                    value: value
                }, callback);
            },
            callMethod: function (method, args, callback) {
                Physics.callBodyMethod({
                    bId: bId,
                    method: method,
                    arguments: args
                }, callback);
            },
            destroy: function (data) {
                if (bId && bodyAdded) {
                    Physics.removeBody(bId);
                }
            },
            attached: function (data) {
                entity = data.entity;
                bId = entity.id;
            }
        };
        return component;
    };
    RigidBody.addToOnigiri = function () {
        Onigiri.RigidBody = RigidBody;
        console.log("Onigiri: added Onigiri.RigidBody");
    };
    return RigidBody;
});