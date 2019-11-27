/**
 * Module description
 * @moduleName Ragdoll
 * @snippet Ragdoll.snippet
Ragdoll({
    jointRigidity: 3,
    jointMaxAngle: 0,
    bodyDensity: 0.05,

    pelvisDimensions: new THREE.Vector3(1.2, 0.3, 0.8),
    torsoDimensions: new THREE.Vector3(1, 0.9, 0.8),
    headDimension: 1.2,
    thighDimensions: new THREE.Vector2(0.5, 0.35),
    calveDimensions: new THREE.Vector2(0.4, 0.35),
    upperArmDimensions: new THREE.Vector2(0.4, 0.3),
    forearmDimensions: new THREE.Vector2(0.4, 0.9),

    pelvisBone: bodyMesh.getObjectByName('bone_main'),
    torsoBone: bodyMesh.getObjectByName('bone_chest'),
    headBone: bodyMesh.getObjectByName('bone_neck'),

    leftThighBone: bodyMesh.getObjectByName('bone_legL'),
    rightThighBone: bodyMesh.getObjectByName('bone_legR'),

    leftCalveBone: bodyMesh.getObjectByName('bone_kneeL'),
    rightCalveBone: bodyMesh.getObjectByName('bone_kneeR'),

    leftUpperArmBone: bodyMesh.getObjectByName('bone_armL'),
    rightUpperArmBone: bodyMesh.getObjectByName('bone_armR'),

    leftForearmBone: bodyMesh.getObjectByName('bone_elbowL'),
    rightForearmBone: bodyMesh.getObjectByName('bone_elbowR')
})
 */
bento.define('onigiri/ragdoll', [
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
    'onigiri/onigiri',
    'onigiri/rigidbody',
    'onigiri/constraint',
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
    Tween,
    Onigiri,
    RigidBody,
    Constraint,
    Physics
) {
    'use strict';
    var Ragdoll = function (settings) {
        var entity;

        var pelvisBone = settings.pelvisBone;
        var pelvisDimensions = Utils.getDefault(settings.pelvisDimensions, new THREE.Vector3(0.5, 0.4, 0.2));

        var torsoBone = settings.torsoBone;
        var torsoDimensions = Utils.getDefault(settings.torsoDimensions, new THREE.Vector3(0.55, 0.45, 0.25));

        var headBone = settings.headBone;
        var headDimension = Utils.getDefault(settings.headDimension, 0.2);

        var leftThighBone = settings.leftThighBone;
        var rightThighBone = settings.rightThighBone;
        var thighDimensions = Utils.getDefault(settings.thighDimensions, new THREE.Vector2(0.25, 0.5));

        var leftCalveBone = settings.leftCalveBone;
        var rightCalveBone = settings.rightCalveBone;
        var calveDimensions = Utils.getDefault(settings.calveDimensions, new THREE.Vector2(0.2, 0.5));

        var leftUpperArmBone = settings.leftUpperArmBone;
        var rightUpperArmBone = settings.rightUpperArmBone;
        var upperArmDimensions = Utils.getDefault(settings.upperArmDimensions, new THREE.Vector2(0.25, 0.4));

        var leftForearmBone = settings.leftForearmBone;
        var rightForearmBone = settings.rightForearmBone;
        var forearmDimensions = Utils.getDefault(settings.forearmDimensions, new THREE.Vector2(0.2, 0.4));

        var jointRigidity = Utils.getDefault(settings.jointRigidity, 1);
        var jointMaxAngle = Utils.getDefault(settings.jointMaxAngle, Math.PI * 0.25);
        var bodyDensity = Utils.getDefault(settings.bodyDensity, 0.05);

        var material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 1
        });
        var isVisible = false;
        var isEnabled = false;

        var enable = function () {
            if (isEnabled) {
                return;
            }
            Bento.objects.attach(head);
            Bento.objects.attach(torso);
            Bento.objects.attach(pelvis);
            Bento.objects.attach(leftUpperArm);
            Bento.objects.attach(leftForearm);
            Bento.objects.attach(rightUpperArm);
            Bento.objects.attach(rightForearm);
            Bento.objects.attach(leftThigh);
            Bento.objects.attach(leftCalve);
            Bento.objects.attach(rightThigh);
            Bento.objects.attach(rightCalve);
            isEnabled = true;
        };

        var disable = function () {
            if (!isEnabled) {
                return;
            }
            Bento.objects.remove(head);
            Bento.objects.remove(torso);
            Bento.objects.remove(pelvis);
            Bento.objects.remove(leftUpperArm);
            Bento.objects.remove(leftForearm);
            Bento.objects.remove(rightUpperArm);
            Bento.objects.remove(rightForearm);
            Bento.objects.remove(leftThigh);
            Bento.objects.remove(leftCalve);
            Bento.objects.remove(rightThigh);
            Bento.objects.remove(rightCalve);
            isEnabled = false;
        };

        var multiplyWorldRotation = function (object, rotation) {
            //unrotate local
            object.updateWorldMatrix(true, true);

            // extract world rotation
            var matrix = new THREE.Matrix4().extractRotation(object.matrixWorld);
            var quat = new THREE.Quaternion().setFromRotationMatrix(matrix);

            //unrotate by world rotation
            object.quaternion.multiply(quat.inverse());
            //rotate on world axis
            object.quaternion.multiply(rotation);
            // unrotate by the unrotation of the unrotation
            object.quaternion.multiply(quat.inverse());
        };

        var setWorldRotation = function (object, rotation, rotationOffset) {
            //unrotate local
            object.rotation.set(0, 0, 0);
            object.updateWorldMatrix(true, true);

            // extract world rotation
            var matrix = new THREE.Matrix4().extractRotation(object.matrixWorld);
            var quat = new THREE.Quaternion().setFromRotationMatrix(matrix);

            //unrotate by world rotation
            object.quaternion.multiply(quat.inverse());
            object.quaternion.multiply(rotation);
            if (rotationOffset) {
                object.quaternion.multiply(rotationOffset);
            }
        };

        var setupTransformFromEntity = function () {
            var set = function (o) {
                o.position.applyQuaternion(entity.quaternion).add(entity.position);
                multiplyWorldRotation(o.object3D, entity.quaternion);
            };
            set(head);
            set(torso);
            set(pelvis);
            set(leftThigh);
            set(leftCalve);
            set(rightThigh);
            set(rightCalve);
            set(leftUpperArm);
            set(leftForearm);
            set(rightUpperArm);
            set(rightForearm);
        };

        var addPoseMethods = function () {
            var addTo = function (joint) {
                joint.poseAxis = function (newPose) {
                    joint.modifyProperty('axisA', '=', Physics.T2C(newPose));
                };
            };
            addTo(neckJoint);
            addTo(backJoint);
            addTo(leftHipJoint);
            addTo(leftKneeJoint);
            addTo(rightHipJoint);
            addTo(rightKneeJoint);
            addTo(leftShoulderJoint);
            addTo(leftElbowJoint);
            addTo(rightShoulderJoint);
            addTo(rightElbowJoint);
        };

        // --- RIGIDBODIES ---
        //head
        var headOffset = new THREE.Vector3(0, (pelvisDimensions.y * 0.5) + (torsoDimensions.y) + (headDimension), 0);
        var head = new Onigiri.Primitive({
            shape: 'sphere',
            position: headOffset.clone(),
            material: material,
            parameters: [
                headDimension,
                6,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Sphere', [headDimension]),
                    mass: ((4 / 3) * Math.PI * (headDimension * headDimension)) * bodyDensity * 0.25,
                    offset: new THREE.Vector3(0, 0, 0)
                })
            ]
        });
        head.visible = isVisible;

        //torso
        var torsoOffset = new THREE.Vector3(0, (pelvisDimensions.y * 0.5) + (torsoDimensions.y * 0.5), 0);
        var torso = new Onigiri.Primitive({
            shape: 'cube',
            position: torsoOffset.clone(),
            material: material,
            parameters: [
                torsoDimensions.x,
                torsoDimensions.y,
                torsoDimensions.z
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Box', [new Physics.Class('Vec3', [torsoDimensions.x * 0.5, torsoDimensions.y * 0.5, torsoDimensions.z * 0.5])]),
                    mass: torsoDimensions.x * torsoDimensions.y * torsoDimensions.z * bodyDensity
                })
            ]
        });
        torso.visible = isVisible;

        //pelvis
        var pelvisOffset = new THREE.Vector3(0, 0, 0);
        var pelvis = new Onigiri.Primitive({
            shape: 'cube',
            position: pelvisOffset.clone(),
            material: material,
            parameters: [
                pelvisDimensions.x,
                pelvisDimensions.y,
                pelvisDimensions.z
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Box', [new Physics.Class('Vec3', [pelvisDimensions.x * 0.5, pelvisDimensions.y * 0.5, pelvisDimensions.z * 0.5])]),
                    mass: pelvisDimensions.x * pelvisDimensions.y * pelvisDimensions.z * bodyDensity
                })
            ]
        });
        pelvis.visible = isVisible;

        //left thigh
        var leftThighOffset = new THREE.Vector3((pelvisDimensions.x * 0.5) - (thighDimensions.x * 0.5), -((pelvisDimensions.y * 0.5) + (thighDimensions.y * 0.5)), 0);
        var leftThigh = new Onigiri.Primitive({
            shape: 'cylinder',
            position: leftThighOffset.clone(),
            material: material,
            parameters: [
                thighDimensions.x * 0.5,
                thighDimensions.x * 0.5,
                thighDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [thighDimensions.x * 0.5, thighDimensions.x * 0.5, thighDimensions.y, 6]),
                    mass: Math.PI * (thighDimensions.x * thighDimensions.x) * 0.5 * thighDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        leftThigh.visible = isVisible;

        //left calve
        var leftCalveOffset = new THREE.Vector3(leftThigh.position.x, -((pelvisDimensions.y * 0.5) + (thighDimensions.y) + (calveDimensions.y * 0.5)), 0);
        var leftCalve = new Onigiri.Primitive({
            shape: 'cylinder',
            position: leftCalveOffset.clone(),
            material: material,
            parameters: [
                calveDimensions.x * 0.5,
                calveDimensions.x * 0.5,
                calveDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [calveDimensions.x * 0.5, calveDimensions.x * 0.5, calveDimensions.y, 6]),
                    mass: Math.PI * (calveDimensions.x * calveDimensions.x) * 0.5 * calveDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        leftCalve.visible = isVisible;

        //right thigh
        var rightThighOffset = new THREE.Vector3(-(pelvisDimensions.x * 0.5) + (thighDimensions.x * 0.5), -((pelvisDimensions.y * 0.5) + (thighDimensions.y * 0.5)), 0);
        var rightThigh = new Onigiri.Primitive({
            shape: 'cylinder',
            position: rightThighOffset.clone(),
            material: material,
            parameters: [
                thighDimensions.x * 0.5,
                thighDimensions.x * 0.5,
                thighDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [thighDimensions.x * 0.5, thighDimensions.x * 0.5, thighDimensions.y, 6]),
                    mass: Math.PI * (thighDimensions.x * thighDimensions.x) * 0.5 * thighDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        rightThigh.visible = isVisible;

        //right calve
        var rightCalveOffset = new THREE.Vector3(rightThigh.position.x, -((pelvisDimensions.y * 0.5) + (thighDimensions.y) + (calveDimensions.y * 0.5)), 0);
        var rightCalve = new Onigiri.Primitive({
            shape: 'cylinder',
            position: rightCalveOffset.clone(),
            material: material,
            parameters: [
                calveDimensions.x * 0.5,
                calveDimensions.x * 0.5,
                calveDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [calveDimensions.x * 0.5, calveDimensions.x * 0.5, calveDimensions.y, 6]),
                    mass: Math.PI * (calveDimensions.x * calveDimensions.x) * 0.5 * calveDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        rightCalve.visible = isVisible;



        //left upper arm
        var leftUpperArmOffset = new THREE.Vector3((torsoDimensions.x * 0.5) + (upperArmDimensions.y * 0.5), (pelvisDimensions.y * 0.5) + (torsoDimensions.y) - (upperArmDimensions.x * 0.5), 0);
        var leftUpperArm = new Onigiri.Primitive({
            shape: 'cylinder',
            position: leftUpperArmOffset.clone(),
            euler: new THREE.Euler(0, 0, Math.PI * 0.5),
            material: material,
            parameters: [
                upperArmDimensions.x * 0.5,
                upperArmDimensions.x * 0.5,
                upperArmDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [upperArmDimensions.x * 0.5, upperArmDimensions.x * 0.5, upperArmDimensions.y, 6]),
                    mass: Math.PI * (upperArmDimensions.x * upperArmDimensions.x) * 0.5 * upperArmDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        leftUpperArm.visible = isVisible;

        //left fore arm
        var leftForearmOffset = new THREE.Vector3((torsoDimensions.x * 0.5) + (upperArmDimensions.y) + (forearmDimensions.y * 0.5), (pelvisDimensions.y * 0.5) + (torsoDimensions.y) - (upperArmDimensions.x * 0.5), 0)
        var leftForearm = new Onigiri.Primitive({
            shape: 'cylinder',
            position: leftForearmOffset.clone(),
            euler: new THREE.Euler(0, 0, Math.PI * 0.5),
            material: material,
            parameters: [
                forearmDimensions.x * 0.5,
                forearmDimensions.x * 0.5,
                forearmDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [forearmDimensions.x * 0.5, forearmDimensions.x * 0.5, forearmDimensions.y, 6]),
                    mass: Math.PI * (forearmDimensions.x * forearmDimensions.x) * 0.5 * forearmDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        leftForearm.visible = isVisible;

        //right upper arm
        var rightUpperArmOffset = new THREE.Vector3(-(torsoDimensions.x * 0.5) - (upperArmDimensions.y * 0.5), (pelvisDimensions.y * 0.5) + (torsoDimensions.y) - (upperArmDimensions.x * 0.5), 0);
        var rightUpperArm = new Onigiri.Primitive({
            shape: 'cylinder',
            position: rightUpperArmOffset.clone(),
            euler: new THREE.Euler(0, 0, Math.PI * 0.5),
            material: material,
            parameters: [
                upperArmDimensions.x * 0.5,
                upperArmDimensions.x * 0.5,
                upperArmDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [upperArmDimensions.x * 0.5, upperArmDimensions.x * 0.5, upperArmDimensions.y, 6]),
                    mass: Math.PI * (upperArmDimensions.x * upperArmDimensions.x) * 0.5 * upperArmDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        rightUpperArm.visible = isVisible;

        //right fore arm
        var rightForearmOffset = new THREE.Vector3(-(torsoDimensions.x * 0.5) - (upperArmDimensions.y) - (forearmDimensions.y * 0.5), (pelvisDimensions.y * 0.5) + (torsoDimensions.y) - (upperArmDimensions.x * 0.5), 0)
        var rightForearm = new Onigiri.Primitive({
            shape: 'cylinder',
            position: rightForearmOffset.clone(),
            euler: new THREE.Euler(0, 0, Math.PI * 0.5),
            material: material,
            parameters: [
                forearmDimensions.x * 0.5,
                forearmDimensions.x * 0.5,
                forearmDimensions.y,
                6
            ],
            components: [
                new RigidBody({
                    shape: new Physics.Class('Cylinder', [forearmDimensions.x * 0.5, forearmDimensions.x * 0.5, forearmDimensions.y, 6]),
                    mass: Math.PI * (forearmDimensions.x * forearmDimensions.x) * 0.5 * forearmDimensions.y * bodyDensity,
                    rotationOffset: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
                })
            ]
        });
        rightForearm.visible = isVisible;


        // --- JOINTS ---
        var neckJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: torso,
            bodyEntityB: head,
            options: {
                pivotA: new Physics.Class('Vec3', [0, torsoDimensions.y * 0.5, 0]),
                pivotB: new Physics.Class('Vec3', [0, -headDimension, 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        torso.attach(neckJoint);

        var backJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: torso,
            bodyEntityB: pelvis,
            options: {
                pivotA: new Physics.Class('Vec3', [0, -torsoDimensions.y * 0.5, 0]),
                pivotB: new Physics.Class('Vec3', [0, pelvisDimensions.y * 0.5, 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        pelvis.attach(backJoint);

        var leftHipJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: pelvis,
            bodyEntityB: leftThigh,
            options: {
                pivotA: new Physics.Class('Vec3', [(pelvisDimensions.x * 0.5) - (thighDimensions.x * 0.5), -pelvisDimensions.y * 0.5, 0]),
                pivotB: new Physics.Class('Vec3', [0, (thighDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        leftThigh.attach(leftHipJoint);

        var leftKneeJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: leftThigh,
            bodyEntityB: leftCalve,
            options: {
                pivotA: new Physics.Class('Vec3', [0, -(thighDimensions.y * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, (calveDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        leftCalve.attach(leftKneeJoint);

        var rightHipJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: pelvis,
            bodyEntityB: rightThigh,
            options: {
                pivotA: new Physics.Class('Vec3', [-(pelvisDimensions.x * 0.5) + (thighDimensions.x * 0.5), -pelvisDimensions.y * 0.5, 0]),
                pivotB: new Physics.Class('Vec3', [0, (thighDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        rightThigh.attach(rightHipJoint);

        var rightKneeJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: rightThigh,
            bodyEntityB: rightCalve,
            options: {
                pivotA: new Physics.Class('Vec3', [0, -(thighDimensions.y * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, (calveDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        rightCalve.attach(rightKneeJoint);

        var leftShoulderJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: torso,
            bodyEntityB: leftUpperArm,
            options: {
                pivotA: new Physics.Class('Vec3', [(torsoDimensions.x * 0.5), (torsoDimensions.y * 0.5) - (upperArmDimensions.x * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, (upperArmDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [1, 0, 0]),
                axisB: new Physics.Class('Vec3', [0, -1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        leftUpperArm.attach(leftShoulderJoint);

        var leftElbowJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: leftUpperArm,
            bodyEntityB: leftForearm,
            options: {
                pivotA: new Physics.Class('Vec3', [0, -(upperArmDimensions.y * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, (forearmDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        leftForearm.attach(leftElbowJoint);

        var rightShoulderJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: torso,
            bodyEntityB: rightUpperArm,
            options: {
                pivotA: new Physics.Class('Vec3', [-(torsoDimensions.x * 0.5), (torsoDimensions.y * 0.5) - (upperArmDimensions.x * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, -(upperArmDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [-1, 0, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        rightUpperArm.attach(rightShoulderJoint);

        var rightElbowJoint = new Constraint({
            class: 'ConeTwistConstraint',
            bodyEntityA: rightUpperArm,
            bodyEntityB: rightForearm,
            options: {
                pivotA: new Physics.Class('Vec3', [0, (upperArmDimensions.y * 0.5), 0]),
                pivotB: new Physics.Class('Vec3', [0, -(forearmDimensions.y * 0.5), 0]),
                axisA: new Physics.Class('Vec3', [0, 1, 0]),
                axisB: new Physics.Class('Vec3', [0, 1, 0]),
                maxForce: jointRigidity,
                angle: jointMaxAngle
            }
        });
        rightForearm.attach(rightElbowJoint);

        var component = {
            name: 'ragdoll',

            head: head,
            neckJoint: neckJoint,
            torso: torso,
            backJoint: backJoint,
            pelvis: pelvis,

            leftHipJoint: leftHipJoint,
            leftThigh: leftThigh,
            leftKneeJoint: leftKneeJoint,
            leftCalve: leftCalve,

            rightHipJoint: rightHipJoint,
            rightThigh: rightThigh,
            rightKneeJoint: rightKneeJoint,
            rightCalve: rightCalve,

            leftShoulderJoint: leftShoulderJoint,
            leftUpperArm: leftUpperArm,
            leftElbowJoint: leftElbowJoint,
            leftForearm: leftForearm,

            rightShoulderJoint: rightShoulderJoint,
            rightUpperArm: rightUpperArm,
            rightElbowJoint: rightElbowJoint,
            rightForearm: rightForearm,
            attached: function (data) {
                entity = this.parent;
                setupTransformFromEntity();
                addPoseMethods();
                enable();
            },
            update: function () {
                var rotationOffset;
                if (isEnabled) {
                    if (entity) {
                        entity.position = pelvis.position.clone();
                    }
                    if (pelvisBone) {
                        setWorldRotation(pelvisBone, pelvis.quaternion.clone());
                    }
                    if (torsoBone) {
                        setWorldRotation(torsoBone, torso.quaternion.clone());
                    }
                    if (headBone) {
                        setWorldRotation(headBone, head.quaternion.clone());
                    }
                    if (leftThighBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, -Math.PI * 0.5, 0));
                        setWorldRotation(leftThighBone, leftThigh.quaternion.clone(), rotationOffset);
                    }
                    if (leftCalveBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
                        setWorldRotation(leftCalveBone, leftCalve.quaternion.clone(), rotationOffset);
                    }
                    if (rightThighBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, -Math.PI * 0.5, 0));
                        setWorldRotation(rightThighBone, rightThigh.quaternion.clone(), rotationOffset);
                    }
                    if (rightCalveBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
                        setWorldRotation(rightCalveBone, rightCalve.quaternion.clone(), rotationOffset);
                    }
                    if (leftUpperArmBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
                        setWorldRotation(leftUpperArmBone, leftUpperArm.quaternion.clone(), rotationOffset);
                    }
                    if (leftForearmBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
                        setWorldRotation(leftForearmBone, leftForearm.quaternion.clone(), rotationOffset);
                    }
                    if (rightUpperArmBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
                        setWorldRotation(rightUpperArmBone, rightUpperArm.quaternion.clone(), rotationOffset);
                    }
                    if (rightForearmBone) {
                        rotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
                        setWorldRotation(rightForearmBone, rightForearm.quaternion.clone(), rotationOffset);
                    }
                }

            },
            destroy: function () {
                disable();
            },
            setEnabled: function (newState) {
                if (newState) {
                    enable();
                } else {
                    disable();
                }
            }
        };
        return component;
    };
    Ragdoll.addToOnigiri = function () {
        Onigiri.Ragdoll = Ragdoll;
        console.log("Onigiri: added Onigiri.Ragdoll");
    };
    return Ragdoll;
});