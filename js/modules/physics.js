/**
 * Module description
 * @moduleName Physics
 * @snippet Physics.snippet
Physics({})
 */
bento.define('modules/physics', [
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
    var cannonWorker;

    //sets the bento side transforms
    var handleTransforms = function (transforms) {
        var objects = Bento.objects.getObjects();
        Utils.forEach(Object.keys(transforms), function (key, i, l, breakLoop) {
            Utils.forEach(objects, function (object, i2, l2, breakLoop2) {
                if (object.id.toString() === key) {
                    object.object3D.position.x = transforms[key].position.x;
                    object.object3D.position.y = transforms[key].position.y;
                    object.object3D.position.z = transforms[key].position.z;
                    object.object3D.quaternion.x = transforms[key].quaternion.x;
                    object.object3D.quaternion.y = transforms[key].quaternion.y;
                    object.object3D.quaternion.z = transforms[key].quaternion.z;
                    object.object3D.quaternion.w = transforms[key].quaternion.w;
                    breakLoop2();
                }
            });
        });
    };

    // every message from the worker is handled here
    var handleWorkerMessage = function (m) {
        var e = m.data;
        if (e.act === "updateTransforms" && e.data.transforms) {
            handleTransforms(e.data.transforms);
        }
    };

    // use this to send our data to the worker
    var sendMessageToWorker = function (act, data) {
        cannonWorker.postMessage({
            act: act,
            data: data || {}
        });
    };

    //set up the worker and instantiate the world
    var init = function () {
        if (!cannonWorker) {
            cannonWorker = new Worker("./lib/cannonworker.js");
            cannonWorker.onmessage = handleWorkerMessage;
        }
        sendMessageToWorker('initWorld', {});
    };
    var update = function () {
        sendMessageToWorker('updateWorld');
    };
    var destroy = function () {
        sendMessageToWorker('cleanWorld', {});
    };
    var addBody = function (options) {
        //reinterpret 3 quaternion
        if (options.quaternion) {
            options.quaternion = {
                x: options.quaternion._x,
                y: options.quaternion._y,
                z: options.quaternion._z,
                w: options.quaternion._w
            };
        }
        sendMessageToWorker('addBody', options);
    };
    var modifyProperties = function (options) {
        sendMessageToWorker('modifyProperties', {
            id: options.id,
            properties: options.properties || {}
        });
    };
    var callMethod = function (options) {
        sendMessageToWorker('callMethod', {
            id: options.id,
            method: options.method,
            arguments: options.arguments || []
        });
    };

    var CannonModule = {
        init: init,
        update: update,
        destroy: destroy,
        addBody: addBody,
        modifyProperties: modifyProperties,
        callMethod: callMethod
    };
    return CannonModule;
});