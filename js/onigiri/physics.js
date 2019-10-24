/**
 * Module description
 * @moduleName Physics
 * @snippet Physics.snippet
Physics({})
 */
bento.define('onigiri/physics', [
    'bento',
    'bento/utils',
    'onigiri/onigiri'
], function (
    Bento,
    Utils,
    Onigiri
) {
    'use strict';
    // --- Vars ---
    var currentCallbackID = 1;
    var callbacks = {};

    // --- Functions ---
    var getById = function (id, callback) {
        // retrieves the first object it finds by its name
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

    //handles all the sent transforms from the WebWorker 
    var handleTransforms = function (transforms) {
        Utils.forEach(Object.keys(transforms), function (key, i, l, breakLoop) {
            getById(parseInt(key), function (entity) {
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
    var handleFromWorker = function (m) {
        var e = m.data;
        if (e.act === "updateTransforms") {
            handleTransforms(e.data.transforms);
        }
        if (e.act === "fireCallback") {
            fireCallback(e.data.callback, e.data.data);
        }
    };

    // use this to send our data to the WebWorker
    var sendToWorker = function (act, data, callback) {
        Physics.worker.postMessage({
            act: act,
            callback: callback,
            data: data || {}
        });
    };

    var addCallback = function (callback) {
        if (!callback) {
            return null;
        }
        var thisCallbackID = currentCallbackID;
        callbacks[thisCallbackID] = callback;
        currentCallbackID++;
        return thisCallbackID;
    };

    var fireCallback = function (callbackID, data) {
        var callback = callbacks[callbackID];
        if (callback) {
            callback(data);
            delete callbacks[callbackID];
        }
    };

    // --- Module ---
    var Physics = {};

    //Creates the WebWorker, and sets up the world
    /* @snippet Physics.init()
Physics.init({
    //world properties
})
    */
    Physics.init = function (data, callback) {
        if (!Physics.worker) {
            Physics.worker = new Worker("./lib/physicsworker.js");
            Physics.worker.onmessage = handleFromWorker;
        }
        sendToWorker('initWorld', data, addCallback(callback));
    };

    //Calls for the world to update in the worker
    Physics.update = function (data, callback) {
        sendToWorker('updateWorld', data, addCallback(callback));
    };

    //Calls for the removal of all bodies from the world
    Physics.destroy = function (data, callback) {
        sendToWorker('cleanWorld', data, addCallback(callback));
    };

    //Calls to add a new Body to the world
    Physics.addBody = function (data, callback) {
        sendToWorker('addBody', data, addCallback(callback));
    };

    //Edits a property on a body
    Physics.modifyBodyProperty = function (data, callback) {
        sendToWorker('modifyBodyProperty', {
            id: data.id,
            property: data.property,
            operator: data.operator,
            value: data.value
        }, addCallback(callback));
    };

    //Fires a method on a body
    Physics.callBodyMethod = function (data, callback) {
        sendToWorker('callBodyMethod', {
            id: data.id,
            method: data.method,
            arguments: data.arguments || []
        }, addCallback(callback));
    };

    // A sendable version of a cannon class
    Physics.CannonClass = function (typeName, args) {
        return {
            isCannonClass: true,
            type: typeName,
            arguments: args.slice()
        };
    };

    Physics.threeToCannon = function (quatOrVec) {
        if (quatOrVec.isQuaternion) {
            return new Physics.CannonClass('Quaternion', [quatOrVec._x, quatOrVec._y, quatOrVec._z, quatOrVec._w]);
        } else if (quatOrVec.isVector3) {
            return new Physics.CannonClass('Vec3', [quatOrVec.x, quatOrVec.y, quatOrVec.z]);
        }
    };

    Physics.addToOnigiri = function () {
        Onigiri.Physics = Physics;
        console.log("Onigiri: added Onigiri.Physics");
    };

    return Physics;
});