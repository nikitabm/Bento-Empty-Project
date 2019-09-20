/**
 * A wrapper for use of three.js nicely in Bento, it's called Onigiri because it has three sides, and wraps nice things (🍙!!)
 * @moduleName Onigiri
 */
bento.define('onigiri/onigiri', [
    'bento',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/components/sprite',
    'bento/components/clickable'
], function (
    Bento,
    Entity,
    EventSystem,
    Utils,
    Sprite,
    Clickable
) {
    'use strict';
    // THREE object references
    var onigiriRenderer = null;
    var onigiriScene = null;
    var onigiriCamera = null;
    var onigiriEntity = null;
    var onigiriClickCasterMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(100000, 100000));
    onigiriClickCasterMesh.position.set(0, 0, 0);
    onigiriClickCasterMesh.rotation.set(-Math.PI * 0.5, 0, 0);
    onigiriClickCasterMesh.visible = false;

    // Texture References
    var backgroundTexture;
    var skyBox;
    var skyCubeMap;

    //camera parameters
    var cameraStyle;
    var perspectiveFieldOfView;
    var orthographicSize;

    // Conversion variables
    var threeToPx = 128;
    var pxToThree = 1 / threeToPx;

    // Common functions
    var setSkyBox = function (scene, pathList) {
        var img;
        skyCubeMap = new THREE.CubeTexture();
        skyBox = pathList;
        for (var i = 0; i < 6; i++) {
            img = Bento.assets.getImage(skyBox[i]);
            skyCubeMap.images[i] = img.image;
        }
        if (i === 6) {
            skyCubeMap.needsUpdate = true;
            scene.background = skyCubeMap;
        }
    };
    var setBackgroundTexture = function (scene, path) {
        var img = Bento.assets.getImage(path);
        backgroundTexture = new THREE.Texture(img.image);
        scene.background = new THREE.Color(backgroundTexture);
    };
    var setBackgroundColor = function (scene, color) {
        scene.background = new THREE.Color(color);
    };


    /* @snippet Onigiri|constructor
    Onigiri({
        // threeToPx: 16,
        // pxToThree: 1,
        // fog: 0, // fog density
        // fogColor: 0xf0f0ff,
        backgroundColor: ${1:0x70b0e4},
        // backgroundPath: 'path',
        // skyBox: ['path/positivex', 'path/negativex', 'path/positivey', 'path/negativey', 'path/positivez', 'path/negativex'],
        cameraStyle: ${2:'perspective'},
        perspectiveFieldOfView: ${3:45},
        orthographicSize: ${4:15},
        //gammaFactor :1,
        //gammaOutput: true
    })
    */
    var Onigiri = function (settings) {
        // reset this as we're making a new one
        onigiriEntity = null;

        // get references
        var viewport = Bento.getViewport();
        var ThreeData = Bento.getRenderer().three;

        // collect the three renderer
        onigiriRenderer = ThreeData.renderer;

        // set up conversion variables
        if (settings.threeToPx) {
            threeToPx = settings.threeToPx;
            pxToThree = 1 / settings.threeToPx;
        } else if (settings.pxToThree) {
            pxToThree = settings.pxToThree;
            threeToPx = 1 / settings.pxToThree;
        }

        //setup camera
        cameraStyle = settings.cameraStyle || 'perspective';
        perspectiveFieldOfView = settings.perspectiveFieldOfView || 45;
        orthographicSize = settings.orthographicSize || 15;
        var isLandscape = (viewport.width / viewport.height) > 1;
        if (cameraStyle === 'perspective') {
            onigiriCamera = new THREE.PerspectiveCamera(perspectiveFieldOfView * (isLandscape ? (viewport.height / 480) : (viewport.height / 640)), viewport.width / viewport.height, 0.1, 1000);
        }
        if (cameraStyle === 'orthographic') {
            var aspect = viewport.width / viewport.height;
            var width = isLandscape ? (orthographicSize) : (orthographicSize * aspect);
            var height = isLandscape ? (orthographicSize / aspect) : (orthographicSize);
            onigiriCamera = new THREE.OrthographicCamera(-width * 0.5, width * 0.5, height * 0.5, -height * 0.5, 0.1, 1000);
        }

        // set up scene
        onigiriScene = new THREE.Scene();
        onigiriScene.add(onigiriCamera); // this is needed to attach stuff to the camera
        onigiriScene.add(onigiriClickCasterMesh); // needed for clickable3D
        ThreeData.sceneList.push([onigiriScene, onigiriCamera]);


        // fog
        if (settings.fogColor && settings.fog) {
            onigiriScene.fog = new THREE.FogExp2(settings.fogColor, settings.fog);
        }

        // background
        if (settings.skyBox) {
            setSkyBox(onigiriScene, settings.skyBox);
        } else if (settings.backgroundPath) {
            setBackgroundTexture(onigiriScene, settings.backgroundPath);
        } else if (settings.backgroundColor) {
            setBackgroundColor(onigiriScene, settings.backgroundColor);
        }

        // set gamma
        onigiriRenderer.gammaFactor = settings.gammaFactor || 1;
        onigiriRenderer.gammaOutput = settings.gammaOutput || false;

        // Add support for retina displays CAUTION: setting this has actually broken the resolution on devices
        // renderer.setPixelRatio(window.devicePixelRatio);

        // Specify the size of the canvas to stop shadows from breaking canvas size
        // renderer.setSize(gl.canvas.width, gl.canvas.height);

        // TODO: SHADOWS
        // onigiriRenderer.shadowMap.enabled = true;
        // onigiriRenderer.shadowMap.autoUpdate = true;
        //onigiriRenderer.shadowMap.type = THREE.PCFSoftShadowMap;


        // Little function to toggle debug mode
        var printDebug = function () {
            console.log('THREE Info:\nMemory: ' + JSON.stringify(ThreeData.renderer.info.memory) +
                '\nObjects: ' + onigiriScene.children.length +
                '\nCamera:' + JSON.stringify({
                    position: Onigiri.camera.position,
                    rotation: Onigiri.camera.rotation
                })
            );
        };

        var updateCamera = function () {
            viewport = Bento.getViewport();
            var thisAspect = viewport.width / viewport.height;
            isLandscape = thisAspect > 1;
            if (cameraStyle === 'perspective') {
                onigiriCamera.fov = perspectiveFieldOfView * (isLandscape ? (viewport.height / 480) : (viewport.height / 640));
                onigiriCamera.aspect = viewport.width / viewport.height;
            }
            if (cameraStyle === 'orthographic') {
                var thisWidth = isLandscape ? (orthographicSize) : (orthographicSize * thisAspect);
                var thisHeight = isLandscape ? (orthographicSize / thisAspect) : (orthographicSize);
                onigiriCamera.left = -thisWidth * 0.5;
                onigiriCamera.right = thisWidth * 0.5;
                onigiriCamera.top = thisHeight * 0.5;
                onigiriCamera.bottom = -thisHeight * 0.5;
            }
            onigiriCamera.updateProjectionMatrix();
        };

        var component = new Object({
            name: 'behavior',
            start: function (data) {
                onigiriEntity = onigiri;
                // this.setupScene();
                EventSystem.on('preDraw', this.preDraw);
                EventSystem.on('buttonDown-home', printDebug);
                EventSystem.on('resize', updateCamera);
            },
            destroy: function (data) {
                onigiriEntity = null;
                EventSystem.off('preDraw', this.preDraw);
                EventSystem.off('buttonDown-home', printDebug);
                EventSystem.off('resize', updateCamera);
                if (skyCubeMap) {
                    skyCubeMap.dispose();
                }
                if (backgroundTexture) {
                    backgroundTexture.dispose();
                }
            },
            update: function (data) {
                if (Bento.input.isKeyDown('d')) {
                    onigiriCamera.position.x += 0.1;
                }
                if (Bento.input.isKeyDown('a')) {
                    onigiriCamera.position.x -= 0.1;
                }
                if (Bento.input.isKeyDown('s')) {
                    onigiriCamera.position.y -= 0.1;
                }
                if (Bento.input.isKeyDown('w')) {
                    onigiriCamera.position.y += 0.1;
                }
                if (Bento.input.isKeyDown('f')) {
                    onigiriCamera.position.z -= 0.1;
                }
                if (Bento.input.isKeyDown('r')) {
                    onigiriCamera.position.z += 0.1;
                }
                if (Bento.input.isKeyDown('up')) {
                    onigiriCamera.rotation.x += 0.01;
                }
                if (Bento.input.isKeyDown('down')) {
                    onigiriCamera.rotation.x -= 0.01;
                }
                if (Bento.input.isKeyDown('right')) {
                    onigiriCamera.rotation.y += 0.01;
                }
                if (Bento.input.isKeyDown('left')) {
                    onigiriCamera.rotation.y -= 0.01;
                }
            },
            preDraw: function (data) {
                // var pixiRenderer = data.renderer.getPixiRenderer();
                // var gl = data.renderer.getContext();

                // THREE rendering
                // THREE.currentRenderer.state.reset();
                //THREE.currentRenderer.render(onigiriScene, onigiriCamera);

                // // We need to reset WebGL state
                // // to PIXI's needs.

                // gl.disableVertexAttribArray(3);
                // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                // gl.disable(gl.SCISSOR_TEST);
                // gl.disable(gl.CULL_FACE);
                // gl.disable(gl.DEPTH_TEST);
                // gl.enable(gl.BLEND);
                // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                // pixiRenderer.shaderManager._currentId = -1;

                // // gl.renderer.shaderManager.setShader(gl.renderer.shaderManager.defaultShader);
                // // gl.renderer.shaderManager.setShader(gl.renderer.shaderManager.primitiveShader);

                // pixiRenderer.shaderManager.setShader(pixiRenderer.shaderManager.complexPrimitiveShader);
                // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            },
        });

        // this is the global object containing the behaviour 
        var onigiri = new Entity({
            name: 'onigiri',
            components: [
                component
            ]
        });

        // automatically add to objects
        Bento.objects.attach(onigiri);
        return onigiri;
    };

    /* @snippet Onigiri.getThreeToPx|Number 
    Onigiri.threeToPx
    */
    Object.defineProperty(Onigiri, 'threeToPx', {
        get: function () {
            return threeToPx;
        },
        set: function (value) {
            threeToPx = value;
            pxToThree = 1 / value;
        }
    });

    /* @snippet Onigiri.pxToThree|Number 
    Onigiri.pxToThree
    */
    Object.defineProperty(Onigiri, 'pxToThree', {
        get: function () {
            return pxToThree;
        },
        set: function (value) {
            pxToThree = value;
            threeToPx = 1 / value;
        }
    });

    /* @snippet Onigiri.scene|THREE_Scene 
    Onigiri.scene
    */
    Object.defineProperty(Onigiri, 'scene', {
        get: function () {
            return onigiriScene;
        },
        set: function (value) {
            Utils.log("Onigiri: 'Onigiri.scene' is read only!");
        }
    });

    /* @snippet Onigiri.camera|THREE_Camera
    Onigiri.camera
    */
    Object.defineProperty(Onigiri, 'camera', {
        get: function () {
            return onigiriCamera;
        },
        set: function (value) {
            Utils.log("Onigiri: 'Onigiri.camera' is read only!");
        }
    });

    /* @snippet Onigiri.renderer|THREE_WebGLRenderer
    Onigiri.renderer
    */
    Object.defineProperty(Onigiri, 'renderer', {
        get: function () {
            return onigiriRenderer;
        },
        set: function (value) {
            Utils.log("Onigiri: 'Onigiri.renderer' is read only!");
        }
    });

    /* @snippet Onigiri.entity|Entity 
    Onigiri.entity
    */
    Object.defineProperty(Onigiri, 'entity', {
        get: function () {
            return onigiriEntity;
        },
        set: function (value) {
            Utils.log("Onigiri: 'Onigiri.entity' is read only!");
        }
    });

    /* @snippet Onigiri.setBackground.snippet
    Onigiri.setBackground(${1:array/path/uint}); // optional: can pass the scene that you want to change
    */
    Onigiri.setBackground = function (background, scene) {
        if (Utils.isArray(background) && background.length === 6) { // cubemap
            setSkyBox(scene || onigiriScene, background);
        } else if (Utils.isString(background)) { // texture
            setBackgroundTexture(scene || onigiriScene, background);
        } else if (Utils.isNumber(background)) { // color
            setBackgroundColor(scene || onigiriScene, background);
        }
    };

    /* @snippet Onigiri.cleanObject3d.snippet
    Onigiri.cleanObject3d('${1:mesh}');
    */
    Onigiri.cleanObject3d = function (obj3d) {
        obj3d.children.forEach(function (mesh) {
            if (mesh.type !== 'Group') {
                // can only dispose of meshes
                if (mesh.type === 'Mesh') {
                    mesh.geometry.dispose();
                }
            } else {
                Onigiri.cleanObject3d(mesh);
            }
        });
    };

    /* @snippet Onigiri.getMesh.snippet
    Onigiri.getMesh('${1:path}'); // calling this directly means you have to clean up memory yourself with Onigiri.cleanObject3d()!!!
    */
    Onigiri.getMesh = function (meshPath) {
        if (!Bento.assets.hasMesh || !Bento.assets.getMesh) {
            Utils.log('Onigiri: MeshManager is missing?!');
            return;
        }
        // check if mesh exists
        if (meshPath || Bento.assets.hasMesh(meshPath)) {
            return Bento.assets.getMesh(meshPath);
        } else {
            if (!meshPath) {
                Utils.log('Onigiri: mesh path is undefined!');
            } else {
                Utils.log('Onigiri: mesh does not exist!');
            }
        }
    };

    /* Searches all of the parents of a specified object3D to find an anchoring entity3D, useful for getting an entity3D from a raycast result
    @snippet Onigiri.findParentEntity3D.snippet
    Onigiri.findParentEntity3D(Object3D);
    */
    Onigiri.findParentEntity3D = function (object3D) {
        var thisObject3D = object3D;
        var thisEntity3D = thisObject3D.entity3D;

        // run over all parents, until we find an entity3D
        while (!thisEntity3D && thisObject3D.parent) {
            thisObject3D = thisObject3D.parent;
            thisEntity3D = thisObject3D.entity3D;
        }

        // we found an entity, return it
        if (thisEntity3D) {
            return thisEntity3D;
        } else {
            // assuming you're using the library correctly this shouldn't happen!
            Utils.log('Onigiri: No parent of this object3D has an assigned Entity3D!');
            return undefined;
        }
    };

    // --- 'Core Constructors' ---
    /* Intermeshes bento Entity and THREE.Object3D by creating a weird mutant hybrid, 
     * that handles hierarchical and transformational changes in THREE,  while retaining as many bento features as possible.
     * 2D transforms are entirely replaced by THREE transforms
     * @snippet Entity3D - Onigiri
    Onigiri.Entity3D({
        name: '',
        family:[''],
        object3D: '${1}', // direct object3D reference
        position: new THREE.Vector3(0, 0, 0),
        euler: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        // disposeGeometry : true,
        // disposeMaterial : true
        components: []
    })
    */
    Onigiri.Entity3D = function (settings) {
        // --- Parameters ---
        var position = settings.position || new THREE.Vector3(0, 0, 0);
        var euler = settings.euler || new THREE.Euler(0, 0, 0);
        var scale = settings.scale || new THREE.Vector3(1, 1, 1);
        var object3D = settings.object3D || new THREE.Object3D({});
        var components = settings.components || [];

        // --- Vars ---
        var parent = null;

        // --- Components ---
        var threeBehaviour = {
            name: "threeBehaviour",
            disposeGeometry: Utils.getDefault(settings.disposeGeometry, true),
            disposeMaterial: Utils.getDefault(settings.disposeMaterial, true),
            onParentAttached: function (data) {
                parent = Onigiri.scene;
                if (data.entity && data.entity.parent && data.entity.parent.object3D) {
                    parent = data.entity.parent.object3D;
                }
                if (object3D) {
                    parent.add(object3D);
                }
            },
            onParentRemoved: function (data) {
                if (object3D && object3D.parent) {
                    parent.remove(object3D);
                    parent = null;

                    //clean up material
                    if (this.disposeMaterial && object3D.material) {
                        object3D.material.dispose();
                    }
                    //clean up geometry
                    if (this.disposeGeometry) {
                        Onigiri.cleanObject3d(object3D);
                    }
                }
            }
        };
        components.unshift(threeBehaviour); // threeBehaviour is top priority

        // --- Entity ---
        var entity3D = new Entity({
            name: settings.name,
            family: settings.family
        });

        // --- Post Setup ---
        // Set transform
        object3D.position.set(position.x, position.y, position.z);
        object3D.rotation.set(euler.x, euler.y, euler.z, euler.order);
        object3D.scale.set(scale.x, scale.y, scale.z);
        object3D.castShadow = true;
        object3D.recieveShadow = true;

        // Directly put a reference to the entity3D in the object3D. this is the object3D
        object3D.entity3D = entity3D;

        // expose the THREE.Object3D
        Object.defineProperty(entity3D, 'object3D', {
            get: function () {
                return object3D;
            },
            set: function () {
                Utils.log("Onigiri: 'Entity3D.object3D' is read only!");
            }
        });

        // expose the visibilty of the object3D
        Object.defineProperty(entity3D, 'visible', {
            get: function () {
                return entity3D.object3D.visible;
            },
            set: function (newVisible) {
                entity3D.object3D.visible = newVisible;
            }
        });

        // expose the position of the object3D
        Object.defineProperty(entity3D, 'position', {
            get: function () {
                return object3D.position;
            },
            set: function (newPosition) {
                object3D.position.set(newPosition);
            }
        });
        // expose euler rotation of the object3D
        Object.defineProperty(entity3D, 'euler', {
            get: function () {
                return object3D.rotation;
            },
            set: function (newEuler) {
                object3D.rotation.set(newEuler);
            }
        });
        // TODO: QUATERNION ROTATION
        // expose the scale of the object3D
        Object.defineProperty(entity3D, 'scale', {
            get: function () {
                return object3D.scale;
            },
            set: function (newScale) {
                object3D.scale.set(newScale);
            }
        });

        Utils.forEach(components, function (component, i, l, breakLoop) {
            entity3D.attach(component);
        });

        return entity3D;
    };

    /* @snippet Mesh - Onigiri
    Onigiri.Mesh({
        path: '${2}', // path to mesh asset
        mesh: '${1}', // direct mesh reference
        position: new THREE.Vector3(0, 0, 0),
        // disposeGeometry : true,
        // disposeMaterial : true
    })
    */
    Onigiri.Mesh = function (settings) {
        // --- Parameters ---
        var mesh = settings.mesh || Onigiri.getMesh(settings.path);

        // --- Entity3D ---
        var meshEntity = new Onigiri.Entity3D({
            name: settings.name || 'onigiriMesh',
            family: settings.family,
            position: settings.position,
            euler: settings.euler,
            scale: settings.scale,
            object3D: mesh,
            disposeGeometry: settings.disposeGeometry,
            disposeMaterial: settings.disposeMaterial,
            components: settings.components
        });
        return meshEntity;
    };

    /* @snippet Light - Onigiri
    Onigiri.Light({
        type: THREE.AmbientLight,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        color: '#ffffff',
        intensity: 1
    })
    */
    Onigiri.Light = function (settings) {
        // --- Parameters ---
        var LightType = settings.type || THREE.AmbientLight;
        var position = settings.position || new THREE.Vector3(0, 0, 0);
        var targetPosition = settings.targetPosition || new THREE.Vector3(0, 0, 0);
        var color = settings.color || '#ffffff';
        var intensity = settings.intensity || 1;

        // --- THREE Objects ---
        var lightObject = new LightType(color, intensity);
        lightObject.position.set(position.x, position.y, position.z);
        //make the target anyway
        var targetObject = new THREE.Object3D();
        targetObject.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
        lightObject.target = targetObject;

        // lightObject.castShadow = true;
        // lightObject.shadow.mapSize.width = 512; // default
        // lightObject.shadow.mapSize.height = 512; // default
        // lightObject.shadow.camera.near = 0.5; // default
        // lightObject.shadow.camera.far = 500; // default

        //group to hold both
        var lightGroup = new THREE.Group();
        lightGroup.add(lightObject);
        lightGroup.add(targetObject);

        // --- Entity3D ---
        var lightEntity = new Onigiri.Entity3D({
            name: settings.name || 'onigiriLight',
            family: settings.family,
            disposeGeometry: false,
            disposeMaterial: false,
            object3D: lightGroup
        }).extend({
            lightObject: lightObject,
            targetObject: targetObject
        });
        return lightEntity;
    };

    /* Raycasts from the camera position to the pointer position on screen, checking against a specific mesh.
     * By Default it casts against 'onigiriClickCasterMesh' which is a huge invisible plane, attached to the scene on creation on Onigiri.
     * Can be used as a replacement for the Clickable concept, but has a more limited usage due to THREE's restrictions on casting.
     * @snippet ClickCaster - Onigiri
    Onigiri.ClickCaster({
        raycastMesh: undefined, // THREE.Mesh - used as an overide from the default
        pointerDownCast: function (castData) {
    
        },
        pointerUpCast: function (castData) {
    
        },
        pointerMoveCast: function (castData) {
    
        }
    })
    */
    Onigiri.ClickCaster = function (settings) {
        // --- PARAMETERS ---
        var raycastMesh = settings.raycastMesh || onigiriClickCasterMesh;

        // --- VARS ---
        var raycaster = new THREE.Raycaster();

        // --- FUNCTIONS ---
        var cast = function (screenPosition) {
            var viewport = Bento.getViewport();

            //set raycast position/direction
            var castPos = new THREE.Vector2(
                ((screenPosition.x / viewport.width) - 0.5) * 2,
                ((screenPosition.y / viewport.height) - 0.5) * -2
            );
            raycaster.setFromCamera(castPos, Onigiri.camera);

            //check if we hit the mesh
            var intersects = [];
            raycastMesh.raycast(raycaster, intersects);
            if (intersects.length) {
                // find impact spot
                var closest = 0;
                var closeDistance = Infinity;
                for (var i = 0; i < intersects.length; i++) {
                    if (intersects[i].distance < closeDistance) {
                        closest = i;
                        closeDistance = intersects[i].distance;
                    }
                }
                return intersects[closest];
            }
            return null;
        };

        // --- COMPONENT ---
        var clickable = new Clickable({
            name: 'onigiriClickCaster',
            pointerDown: function (data) {
                if (settings.pointerDownCast) {
                    settings.pointerDownCast(cast(data.position));
                }
            },
            pointerUp: function (data) {
                if (settings.pointerUpCast) {
                    settings.pointerUpCast(cast(data.position));
                }
            },
            pointerMove: function (data) {
                if (settings.pointerMoveCast) {
                    settings.pointerMoveCast(cast(data.position));
                }
            }
        });
        clickable.setRaycastMesh = function (newMesh) {
            raycastMesh = newMesh;
        };
        return clickable;
    };
    /* @snippet ClickCaster.defaultMesh - Onigiri
    Onigiri.ClickCaster.defaultMesh = new THREE.Mesh();
    */
    Object.defineProperty(Onigiri.ClickCaster, 'defaultMesh', {
        get: function () {
            return onigiriClickCasterMesh;
        },
        set: function (newMesh) {
            Onigiri.scene.remove(onigiriClickCasterMesh);
            onigiriClickCasterMesh = newMesh;
            Onigiri.scene.add(onigiriClickCasterMesh);
        }
    });

    /* 
    * Used to 'install' extensions into Onigiri, allowing you to perform 'Onigiri.ExtensionName({})' instead of defining everything in the require of the file
    * @snippet Onigiri.addExtensions.snippet
    Onigiri.addExtensions([
        'onigiri/primitive'
    ]); 
    */
    Onigiri.addExtensions = function (extensionNames) {
        Utils.forEach(extensionNames, function (extensionName, i, l, breakLoop) {
            bento.require(['onigiri/' + extensionName], function (Extension) {});
        });
    };

    /* @snippet THREE.Vector2 - Onigiri
    THREE.Vector3(${1:0},${2:0})
    */

    /* @snippet THREE.Vector3 - Onigiri
    THREE.Vector3(${1:0},${2:0},${3:0})
    */

    /* @snippet THREE.MeshStandardMaterial - Onigiri
    THREE.MeshStandardMaterial({
        color: '#ff00ff',
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 1,
        depthWrite: true,
        side: THREE.FrontSide,
        blending: THREE.NormalBlending
    })
    */

    return Onigiri;
});