/**
 * Module description
 * @moduleName Physics
 * @snippet Physics.snippet
Physics({})
 */
bento.define('onigiri/physics', [
    'bento',
    'bento/utils',
    'onigiri/onigiri',
    'bento/eventsystem'
], function (
    Bento,
    Utils,
    Onigiri,
    EventSystem
) {
    'use strict';
    // --- Vars ---
    var currentCallbackID = 1;
    var callbacks = {};
    var constraints = {};
    var isCleaning = false;

    // --- Functions ---
    // retrieves the first object it finds by its id
    var getEntityByBodyId = function (id, callback) {
        var i, object;
        var objects = Bento.objects.getObjects();
        for (i = 0; i < objects.length; i++) {
            object = objects[i];
            if (!object) {
                continue;
            }
            if (!object.id) {
                continue;
            }
            if (object.id === id) {
                if (callback) {
                    callback(object);
                }
                return object;
            }
        }
    };

    // handles all the sent transforms from the WebWorker 
    var handleTransforms = function (transforms) {
        Utils.forEach(Object.keys(transforms), function (key, i, l, breakLoop) {
            getEntityByBodyId(parseInt(key), function (entity) {
                var p = transforms[key].p;
                var q = transforms[key].q;
                if (p) {
                    entity.object3D.position.set(p.x, p.y, p.z);
                }
                if (q) {
                    entity.object3D.quaternion.set(q.x, q.y, q.z, q.w);
                }
            });
        });
    };

    // every message from the WebWorker arrives here
    var handleFromWorker = function (message) {
        var e = message.data;
        if (e.act === "updateTransforms") {
            handleTransforms(e.data.transforms);
        }
        if (e.act === "fireCallback") {
            fireCallback(e.data.callback, e.data.data);
        }
    };

    // use this to send our data to the WebWorker
    var actionQueue = [];
    var sendToWorker = function (act, data, callback) {
        var action = {
            act: act,
            callback: callback,
            data: data || {}
        };
        actionQueue.push(action);
    };

    // adds a callback to the callback object, and returns it's id to send to the WebWorker
    var addCallback = function (callback) {
        if (!callback) {
            return null;
        }
        var thisCallbackID = currentCallbackID;
        callbacks[thisCallbackID] = callback;
        currentCallbackID++;
        return thisCallbackID;
    };

    // fire and remove a used callback, referred to by id
    var fireCallback = function (callbackID, data) {
        var callback = callbacks[callbackID];
        if (callback) {
            callback(data);
            delete callbacks[callbackID];
        }
    };

    // --- Module ---
    var Physics = {};

    // Creates the WebWorker, and sets up the world
    /* @snippet Physics.initiate()
Physics.initiate({
    iterations: 25
});
    */
    Physics.initiate = function (settings) {
        // event callbacks
        var updateWorld = function () {
            sendToWorker('updateWorld', {});
            var message = {
                time: Date.now(),
                actions: actionQueue
            };
            Physics.worker.postMessage(message);
            actionQueue = [];
        };

        //create worker
        if (!Physics.worker) {
            Physics.worker = new window.Worker("./lib/physicsworker.js");
            Physics.worker.onmessage = handleFromWorker;
        }

        //create physics world
        sendToWorker('initWorld', {
            solver: {
                iterations: settings.iterations || 10,
                tolerance: settings.tolerance || 1 / 1e8
            }
        });

        // set listeners
        EventSystem.on('postUpdate', updateWorld);
    };

    Physics.cleanWorld = function () {
        isCleaning = true;
        sendToWorker('cleanWorld', {}, addCallback(function () {
            isCleaning = false;
        }));
        constraints = {};
    };

    // Calls to add a new Body to the world
    /* @snippet Physics.addBody()
Physics.addBody({
    id: entity.id,
    shape: new Physics.Class('Box', [new Physics.Class('Vec3', [1, 1, 1])]),
    mass: 1,
    position: Physics.T2C(entity.position),
    quaternion: Physics.T2C(entity.quaternion)
}, function (){});
    */
    Physics.addBody = function (data, callback) {
        sendToWorker('addBody', data, addCallback(callback));
    };

    // Calls to add a new Body to the world
    /* @snippet Physics.removeBody()
Physics.removeBody({
    id: entity.id
}, function (){});
    */
    Physics.removeBody = function (data, callback) {
        // no need to manually remove if we're clearing
        if (isCleaning) {
            return;
        }
        sendToWorker('removeBody', data, addCallback(callback));
    };

    // Edits a property on a body
    /* @snippet Physics.modifyBodyProperty()
Physics.modifyBodyProperty({
    id: data.id,
    property: data.property,
    operator: data.operator,
    value: data.value
}, function(){
    // callback
});
    */
    Physics.modifyBodyProperty = function (data, callback) {
        sendToWorker('modifyBodyProperty', {
            bId: data.bId,
            property: data.property,
            operator: data.operator,
            value: data.value
        }, addCallback(callback));
    };

    // Fires a method on a body
    /* @snippet Physics.callBodyMethod()
Physics.callBodyMethod({
    id: data.id,
    method: data.method,
    arguments: data.arguments || []
}, function(){
    // callback
});
    */
    Physics.callBodyMethod = function (data, callback) {
        sendToWorker('callBodyMethod', {
            bId: data.bId,
            method: data.method,
            arguments: data.arguments || []
        }, addCallback(callback));
    };

    // Calls to add a new Constraint to the world
    /* @snippet Physics.addConstraint()
Physics.addConstraint({
    component: component,
    cId: constraintId,
    class: thisClass,
    bAId: bodyEntityA.id,
    bBId: bodyEntityB.id,
    options: options
}, function (){});
    */
    Physics.addConstraint = function (data, callback) {
        var component = data.component; // keep ahold of this
        delete data.component; // don't send it
        sendToWorker('addConstraint', data, addCallback(function () {
            constraints[data.cId] = component;
            if (callback) {
                callback();
            }
        }));
    };

    // Calls to remove a  Constraint from the world
    /* @snippet Physics.removeConstraint()
Physics.removeConstraint({
    cId: entity.id
}, function (){});
    */
    Physics.removeConstraint = function (data, callback) {
        delete constraints[data.cId];
        // no need to manually remove if we're clearing
        if (isCleaning) {
            return;
        }
        sendToWorker('removeConstraint', data, addCallback(callback));
    };

    // Edits a property on a constraint
    /* @snippet Physics.modifyConstraintProperty()
Physics.modifyConstraintProperty({
    id: data.id,
    property: data.property,
    operator: data.operator,
    value: data.value
}, function(){
    // callback
});
    */
    Physics.modifyConstraintProperty = function (data, callback) {
        sendToWorker('modifyConstraintProperty', {
            cId: data.cId,
            property: data.property,
            operator: data.operator,
            value: data.value
        }, addCallback(callback));
    };

    // Fires a method on a constraint
    /* @snippet Physics.callConstraintMethod()
Physics.callConstraintMethod({
    cId: data.id,
    method: data.method,
    arguments: data.arguments || []
}, function(){
    // callback
});
    */
    Physics.callConstraintMethod = function (data, callback) {
        sendToWorker('callConstraintMethod', {
            cId: data.cId,
            method: data.method,
            arguments: data.arguments || []
        }, addCallback(callback));
    };


    // Converts a three to a CannonClass
    /* @snippet Physics.T2C()
Physics.T2C(quatOrVec);
    */
    Physics.T2C = function (quatOrVec) {
        if (quatOrVec.isQuaternion) {
            return new Physics.Class('Quaternion', [quatOrVec._x, quatOrVec._y, quatOrVec._z, quatOrVec._w]);
        } else if (quatOrVec.isVector3) {
            return new Physics.Class('Vec3', [quatOrVec.x, quatOrVec.y, quatOrVec.z]);
        }
        return quatOrVec;
    };


    // --- Classes ---
    // A sendable version of a cannon class
    /* @snippet Physics.Class()|CannonClass
Physics.Class('Class',['arguments']);
    */
    Physics.Class = function (typeName, args) {
        return {
            isCannonClass: true,
            type: typeName,
            arguments: args.slice()
        };
    };
    // A sendable version of a cannon constant
    /* @snippet Physics.Constant()|CannonClass
Physics.Constant('Constant',['arguments']);
    */
    Physics.Constant = function (constant) {
        return {
            isCannonConstant: true,
            constant: constant
        };
    };

    Physics.addToOnigiri = function () {
        Onigiri.Physics = Physics;
        console.log("Onigiri: added Onigiri.Physics");
    };

    return Physics;
});