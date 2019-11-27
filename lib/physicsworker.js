//--- WORKER VARS ---
var CannonWorker = self;
var isInit = false;
var world;
var bodyMap = {};
var constraintMap = {};
var lastSentTransforms = {};
var positionUpdateThreshold = 0.02;
var quaternionUpdateThreshold = 0.02;
var lastMessageTime = 0;

// --- UTILITIES  ---
var interpretCannonClasses = function (object) {
    var i;
    // it's a cannonClass
    if (object.isCannonClass) {
        // Loop over the arguments of this type, and create all the classes that are present
        var args = [];
        for (i = 0; i < object.arguments.length; i++) {
            args.push(interpretCannonClasses(object.arguments[i]));
        }

        // instantiate the class if it's valid
        var Type = CANNON[object.type];
        if (Type) {
            return new Type(...args);
        } else {
            console.error('CannonWorker: Attempting to make non existing Cannon class - ' + object.type);
            return undefined;
        }
    }
    // it's a constant
    if (object.isCannonConstant) {
        // break the definition down
        var brokenString = object.constant.split('.');
        // get constant definition
        var value = CANNON;
        for (i = 0; i < brokenString.length; i++) {
            value = value[brokenString[i]];
            if (typeof value === 'undefined') {
                return;
            }
        }
        if (value === CANNON) {
            return;
        }
        return value;
    }
    // it's an array, interpret the array
    if (typeof object === 'object' && object.length) {
        var interpretedArray = [];
        for (i = 0; i < object.length; i++) {
            interpretedArray.push(interpretCannonClasses(object[i]));
        }
        object = interpretedArray;
    }
    return object;
};
var interpretDataObject = function (data) {
    var keys = Object.keys(data);
    var convertedData = {};
    for (var i = keys.length - 1; i >= 0; i--) {
        convertedData[keys[i]] = interpretCannonClasses(data[keys[i]]);
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

    console.log("CannonWorker is now running!");

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
        var bId = b.bId;
        var p = b.position;
        var q = b.quaternion;
        if (bId) {
            var lT = lastSentTransforms[bId];
            if (lT && (positionUpdateThreshold || quaternionUpdateThreshold)) {
                var lP = lT.p;
                var lQ = lT.q;
                transforms[bId] = {};
                if (Math.abs(p.x - lP.x) > positionUpdateThreshold || Math.abs(p.y - lP.y) > positionUpdateThreshold || Math.abs(p.z - lP.z) > positionUpdateThreshold) {
                    transforms[bId].p = p;
                    lastSentTransforms[bId].p = p.clone();
                }
                if (lQ.inverse().mult(q).toAxisAngle()[1] > quaternionUpdateThreshold) {
                    transforms[bId].q = q;
                    lastSentTransforms[bId].q = new CANNON.Quaternion().copy(q);
                } else {}
            } else {
                transforms[bId] = {};
                transforms[bId].p = p;
                transforms[bId].q = q;
                lastSentTransforms[bId] = {};
                lastSentTransforms[bId].p = p.clone();
                lastSentTransforms[bId].q = new CANNON.Quaternion().copy(q);
            }
        }
    }

    // Send transform data back to the main thread
    sendToMainThread('updateTransforms', {
        transforms: transforms
    });
};

CannonWorker.cleanWorld = function (data) {
    var i;
    //remove all the bodies from the world
    var bodyCount = world.bodies.length;
    for (i = bodyCount - 1; i >= 0; i--) {
        world.removeBody(world.bodies[i]);
    }
    bodyMap = {};
    //remove all the constraints from the world
    var constraintCount = world.constraints.length;
    for (i = constraintCount - 1; i >= 0; i--) {
        world.removeConstraint(world.constraints[i]);
    }
    constraintMap = {};
};

CannonWorker.addBody = function (data) {
    // Do nothing if we're not ready
    if (!isInit) {
        return;
    }

    // Convert all the CannonClasses in the data object
    var interpretedData = interpretDataObject(data);

    // if there is an ID here
    if (typeof interpretedData.bId !== 'undefined') {
        //make the new body
        var body = new CANNON.Body({
            mass: interpretedData.mass || 0
        });

        //add the defined shape or a default one
        if (interpretedData.shape) {
            body.addShape(interpretedData.shape);
        }

        //set some default values 
        body.allowSleep = interpretedData.allowSleep !== 'undefined' ? interpretedData.allowSleep : true;
        body.sleepSpeedLimit = interpretedData.sleepSpeedLimit !== 'undefined' ? interpretedData.sleepSpeedLimit : 0.01;
        body.sleepTimeLimit = interpretedData.sleepTimeLimit !== 'undefined' ? interpretedData.sleepTimeLimit : 5;
        body.bId = interpretedData.bId;

        // Copy the interpreted data object onto the body properties
        Object.assign(body, interpretedData);

        //add the body to the world
        world.addBody(body);
        bodyMap[interpretedData.bId.toString()] = body;
    }
};

CannonWorker.removeBody = function (data) {
    var bId = data.bId;
    if (bId) {
        world.removeBody(bodyMap[bId]);
        delete bodyMap[bId];
    }
};

CannonWorker.modifyBodyProperty = function (data) {
    if (!isInit) {
        return;
    }
    var targetID = data.bId;
    var body = bodyMap[targetID];
    var propertyRef = body;
    var pList = data.property.split('.');
    for (var i = 0; i < pList.length - 1; i++) {
        var property = pList[i];
        if (!propertyRef[property]) {
            propertyRef[property] = {};
        }
        propertyRef = propertyRef[property];

    }
    if (body) {
        switch (data.operator) {
        case '+=':
            propertyRef[pList[pList.length - 1]] += interpretCannonClasses(data.value);
            break;
        case '-=':
            propertyRef[pList[pList.length - 1]] -= interpretCannonClasses(data.value);
            break;
        case '=':
            propertyRef[pList[pList.length - 1]] = interpretCannonClasses(data.value);
            break;
        default:
            propertyRef[pList[pList.length - 1]] = interpretCannonClasses(data.value);
            break;
        }
    }
};

CannonWorker.callBodyMethod = function (data) {
    if (!isInit) {
        return;
    }

    var args = [];
    for (var i = 0; i < data.arguments.length; i++) {
        args.push(interpretCannonClasses(data.arguments[i]));
    }

    var targetID = data.bId;
    var body = bodyMap[targetID];
    if (body && body[data.method]) {
        body[data.method](...args);
    }
};

CannonWorker.addConstraint = function (data) {
    // Do nothing if we're not ready
    if (!isInit) {
        return;
    }

    // Convert all the CannonClasses in the data object
    var interpretedData = interpretDataObject(data);
    var interpretedOptions = interpretDataObject(interpretedData.options);
    var ConstraintClass = CANNON[interpretedData.class];
    // if there is an ID here
    if (ConstraintClass && typeof interpretedData.cId !== 'undefined') {
        //make the new body
        var constraint = new ConstraintClass(
            bodyMap[interpretedData.bAId],
            bodyMap[interpretedData.bBId],
            interpretedOptions
        );

        //add the body to the world
        world.addConstraint(constraint);
        constraintMap[interpretedData.cId.toString()] = constraint;
    }
};

CannonWorker.removeConstraint = function (data) {
    var cId = data.cId;
    if (cId) {
        world.removeConstraint(constraintMap[cId]);
        delete constraintMap[cId];
    }
};

CannonWorker.modifyConstraintProperty = function (data) {
    if (!isInit) {
        return;
    }
    var targetID = data.cId;
    var constraint = constraintMap[targetID];
    var propertyRef = constraint;
    var pList = data.property.split('.');
    for (var i = 0; i < pList.length - 1; i++) {
        var property = pList[i];
        if (!propertyRef[property]) {
            propertyRef[property] = {};
        }
        propertyRef = propertyRef[property];

    }
    if (constraint) {
        switch (data.operator) {
        case '+=':
            propertyRef[pList[pList.length - 1]] += interpretCannonClasses(data.value);
            break;
        case '-=':
            propertyRef[pList[pList.length - 1]] -= interpretCannonClasses(data.value);
            break;
        case '=':
            propertyRef[pList[pList.length - 1]] = interpretCannonClasses(data.value);
            break;
        default:
            propertyRef[pList[pList.length - 1]] = interpretCannonClasses(data.value);
            break;
        }
    }
};

CannonWorker.callConstraintMethod = function (data) {
    if (!isInit) {
        return;
    }

    var args = [];
    for (var i = 0; i < data.arguments.length; i++) {
        args.push(interpretCannonClasses(data.arguments[i]));
    }

    var targetID = data.cId;
    var constraint = constraintMap[targetID];
    if (constraint && constraint[data.method]) {
        constraint[data.method](...args);
    }
};


//handle commands from bento
CannonWorker.onmessage = function (message) {
    var handleAction = function (action) {
        if (!action.act) {
            return;
        }
        //call the method
        var data = CannonWorker[action.act](action.data);

        //fire the callback
        if (action.callback) {
            sendToMainThread('fireCallback', {
                callback: action.callback,
                data: data
            });
        }
    };
    // grab the event from the message
    var msg = message.data;
    for (var i = 0; i < msg.actions.length; i++) {
        handleAction(msg.actions[i]);
    }
    lastMessageTime = msg.time;
};