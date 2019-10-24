//--- WORKER VARS ---
var world;
var bodyMap = {};
var lastSentTransforms = {};
var isInit = false;
var CannonWorker = self;
var positionUpdateThreshold = 0.05;
var quaternionUpdateThreshold = 0.05;

// --- UTILITIES ---
var interpretCannonClass = function (object) {
    // this isn't a CannonClass, so return it's value
    if (!object.isCannonClass) {
        return object;
    }

    // Loop over the arguments of this type, and create all the classes that are present
    var args = [];
    for (var i = 0; i < object.arguments.length; i++) {
        args.push(interpretCannonClass(object.arguments[i]));
    }

    // instantiate the class if it's valid
    var Type = CANNON[object.type];
    if (Type) {
        return new Type(...args);
    } else {
        console.error('CannonWorker: Attempting to make non existing Cannon class - ' + object.type);
        return undefined;
    }
};
var interpretDataObject = function (data) {
    var keys = Object.keys(data);
    var convertedData = {};
    for (var i = keys.length - 1; i >= 0; i--) {
        convertedData[keys[i]] = interpretCannonClass(data[keys[i]]);
    }
    return convertedData;
};
var sendToMainThread = function (act, data) {
    CannonWorker.postMessage({
        act: act,
        data: data
    });
};

// --- WORKER FUNCTIONS ---
CannonWorker.initWorld = function (data) {
    // if this is the first time calling this import the scripts
    if (!isInit) {
        CannonWorker.importScripts('./cannon.js');
    }

    // Init physics world with some default properties
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity = new CANNON.Vec3(0, -9.81, 0);
    world.allowSleep = true;

    // Convert all the CannonClasses in the data object
    var interpretedData = interpretDataObject(data);

    //edit solver seperately
    if (interpretedData.solver) {
        Object.assign(world.solver, interpretedData.solver);
        delete interpretedData.solver;
    }

    // Copy the interpreted data object onto the world properties
    Object.assign(world, interpretedData);

    //we're ready to rumble
    isInit = true;
};

CannonWorker.updateWorld = function (data) {
    // Do nothing if we're not ready
    if (!isInit) {
        return;
    }

    // Step the world
    world.step(data.deltaTIme || (1 / 60));

    // Copy over the transform data to an object
    var transforms = {};
    for (var i = 0; i !== world.bodies.length; i++) {
        var b = world.bodies[i];
        var id = b.id;
        var p = b.position;
        var q = b.quaternion;
        if (id) {
            var lT = lastSentTransforms[id];
            if (lT && (positionUpdateThreshold || quaternionUpdateThreshold)) {
                var lP = lT.p;
                var lQ = lT.q;
                transforms[id] = {};
                if (Math.abs(p.x - lP.x) > positionUpdateThreshold || Math.abs(p.y - lP.y) > positionUpdateThreshold || Math.abs(p.z - lP.z) > positionUpdateThreshold) {
                    transforms[id].p = p;
                    lastSentTransforms[id].p = p.clone();
                }
                if (lQ.inverse().mult(q).toAxisAngle()[1] > quaternionUpdateThreshold) {
                    transforms[id].q = q;
                    lastSentTransforms[id].q = new CANNON.Quaternion().copy(q);
                } else {}
            } else {
                transforms[id] = {};
                transforms[id].p = p;
                transforms[id].q = q;
                lastSentTransforms[id] = {};
                lastSentTransforms[id].p = p.clone();
                lastSentTransforms[id].q = new CANNON.Quaternion().copy(q);
            }
        }
    }

    // Send transform data back to the main thread
    sendToMainThread('updateTransforms', {
        transforms: transforms
    });
};

CannonWorker.cleanWorld = function (data) {
    //remove all the bodies from the world
    var bodyCount = world.bodies.length;
    for (var i = bodyCount - 1; i >= 0; i--) {
        world.removeBody(world.bodies[i]);
    }
    bodyMap = {};
};

CannonWorker.addBody = function (data) {
    // Do nothing if we're not ready
    if (!isInit) {
        return;
    }

    // Convert all the CannonClasses in the data object
    var interpretedData = interpretDataObject(data);

    // if there is an ID here
    if (interpretedData.id) {
        //make the new body
        var body = new CANNON.Body({
            mass: interpretedData.mass || 0
        });

        //add the defined shape or a default one
        if (interpretedData.shape) {
            body.addShape(interpretedData.shape);
        }

        //set some default values 
        body.allowSleep = true;
        body.sleepSpeedLimit = 0.1;
        body.sleepTimeLimit = 1;
        body.id = interpretedData.id;

        // Copy the interpreted data object onto the body properties
        Object.assign(body, interpretedData);

        //add the body to the world
        world.addBody(body);
        bodyMap[interpretedData.id.toString()] = body;
    }
};

CannonWorker.modifyBodyProperty = function (data) {
    if (!isInit) {
        return;
    }
    var targetID = data.id;
    var body = bodyMap[targetID];
    if (body) {
        body[data.property] = interpretCannonClass(data.value);
    }
};

CannonWorker.callBodyMethod = function (data) {
    if (!isInit) {
        return;
    }

    var args = [];
    for (var i = 0; i < data.arguments.length; i++) {
        args.push(interpretCannonClass(data.arguments[i]));
    }

    var targetID = data.id;
    var body = bodyMap[targetID];
    if (body && body[data.method]) {
        body[data.method](...args);
    }
};

//handle commands from bento
CannonWorker.onmessage = function (message) {
    // grab the event from the message
    var e = message.data;
    if (!e.act) {
        return;
    }
    //call the method
    var data = CannonWorker[e.act](e.data);

    //fire the callback
    if (e.callback) {
        sendToMainThread('fireCallback', {
            callback: e.callback,
            data: data
        });
    }
};