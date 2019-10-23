//--- WORKER VARS ---
var world;
var bodyMap = {};
var isInit = false;
var CannonWorker = self;
var lastUpdateTime = Date.now();

// --- UTILITIES ---
var instantiateClassFromObject = function (object) {
    if (!object.type || !object.arguments) {
        return;
    }

    //reinterpret quats and vecs to cannon
    var args = [];
    var arg;
    for (var i = 0; i < object.arguments.length; i++) {
        arg = object.arguments[i];
        if (!isNaN(arg.x) && !isNaN(arg.y) && !isNaN(arg.z) && !isNaN(arg.w)) {
            arg = new CANNON.Quaternion(arg.x, arg.y, arg.z, arg.w);
        } else if (!isNaN(arg.x) && !isNaN(arg.y) && !isNaN(arg.z)) {
            arg = new CANNON.Vec3(arg.x, arg.y, arg.z);
        } else if (!isNaN(arg.x) && !isNaN(arg.y)) {
            arg = new CANNON.Vec2(arg.x, arg.y);
        }
        args.push(arg);
    }

    var instance = new CANNON[object.type](...args);
    return instance;
};

// --- WORKER FUNCTIONS ---
CannonWorker.initWorld = function (data) {
    CannonWorker.importScripts('./cannon.js');

    // Init physics world
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity = new CANNON.Vec3(0, -9.81, 0);
    //copy new properties onto the world
    Object.assign(world, data);

    //we're ready to rumble
    isInit = true;
};

CannonWorker.updateWorld = function (data) {
    if (!isInit) {
        return;
    }
    // Step the world
    var dt = (Date.now() - lastUpdateTime) / 1000;
    world.step(1 / 60);
    lastUpdateTime = Date.now();

    // Copy over the data to the buffers
    var transforms = {};
    for (var i = 0; i !== world.bodies.length; i++) {
        var b = world.bodies[i];
        var id = b.id;
        var p = b.position;
        var q = b.quaternion;
        if (id) {
            transforms[id] = {};
            transforms[id].position = p;
            transforms[id].quaternion = q;
        }
    }

    // Send data back to the main thread
    CannonWorker.postMessage({
        act: 'updateTransforms',
        data: {
            transforms: transforms
        }
    });
};

CannonWorker.cleanWorld = function (data) {
    var bodyCount = world.bodies.length;
    for (var i = bodyCount - 1; i >= 0; i--) {
        world.removeBody(world.bodies[i]);
    }
    bodyMap = {};
};

CannonWorker.addBody = function (data) {
    if (!isInit) {
        return;
    }
    var mass = data.mass || 0;
    var shape = instantiateClassFromObject(data.shape) || new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    var position = data.position || new CANNON.Vec3(0, 0, 0);
    var quaternion = data.quaternion;
    var id = data.id;
    if (id) {
        //make the new body
        var body = new CANNON.Body({
            mass: mass
        });
        body.addShape(shape);
        body.position.set(position.x || 0, position.y || 0, position.z || 0);
        body.quaternion.set(quaternion.x || 0, quaternion.y || 0, quaternion.z || 0, quaternion.w || 0);
        body.id = id;
        world.addBody(body);
        bodyMap[id.toString()] = body;
    }
};

CannonWorker.modifyProperties = function (data) {
    if (!isInit) {
        return;
    }
    var targetID = data.id;
    if (targetID === 'world') {
        Object.assign(world, data.properties);
        return;
    } else {
        var body = bodyMap[targetID];
        if (body) {
            Object.assign(body, data.properties);
        }
    }
};

CannonWorker.callMethod = function (data) {
    if (!isInit) {
        return;
    }
    var targetID = data.id;
    if (targetID === 'world' && world[data.method]) {
        world[data.method](...data.arguments);
        return;
    } else {
        var body = bodyMap[targetID];
        if (body && body[data.method]) {
            body[data.method](...data.arguments);
        }
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
    CannonWorker[e.act](e.data);
};