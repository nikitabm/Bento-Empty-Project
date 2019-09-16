/**
 * Extends asset manager with mesh loading and a way to get meshes.
 * @moduleName MeshManager
 */
bento.define('managers/meshmanager', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
    'bento/utils',
    'bento/tween',
    'modules/inlinethreeloaders'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Entity,
    Utils,
    Tween,
    InlineThreeLoaders
) {
    'use strict';

    var assets3d = {};
    var getMesh = function (name) {
        var mesh, fbx = assets3d[name];
        if (!fbx) {
            Utils.log("ERROR: Mesh " + name + " could not be found");
            return null;
        } else {
            mesh = THREE.SkeletonUtils.clone(fbx);
        }
        return mesh;
    };

    /**
     * Load and parse FBX file, put in list
     */
    var loadFBX = function (asset, path, onLoad) {
        var fbxLoader = new THREE.FBXLoader();
        fbxLoader.load(path, function (fbx) {
            var i, mesh;
            for (i in fbx.children) {
                mesh = fbx.children[i];
                if (!mesh) {
                    continue;
                }
                if (Utils.isUndefined(mesh.material)) {
                    continue;
                }
                if (!mesh.material.emissiveIntensity) {
                    continue;
                }
                if (mesh.material.emissiveMap) {
                    continue;
                }
                mesh.material.emissiveMap = mesh.material.map;
            }

            assets3d[asset] = fbx;
            if (onLoad) {
                onLoad();
            }
        }, undefined, function (error) {
            console.error(error);
        });
    };

    /**
     * Load and parse GLTF file, put in list
     */
    var loadGLTF = function (asset, path, onLoad) {
        var isBase64 = asset.indexOf && asset.indexOf('data:') === 0;
        var assetPath = isBase64 ? '' : 'assets/3d/gltf/';
        var gltfLoader = new THREE.GLTFLoader().setPath(assetPath);
        var localPath = isBase64 ? asset : path.replace(assetPath, '');

        gltfLoader.load(localPath, function (gltf) {
            var mesh;
            gltf.scene.traverse(function (child) {
                if (!child.isMesh) {
                    return;
                }
                mesh = child;
                if (!mesh) {
                    return;
                }
                if (Utils.isUndefined(mesh.material)) {
                    return;
                }
                if (!mesh.material.emissiveIntensity) {
                    return;
                }
                if (mesh.material.emissiveMap) {
                    return;
                }
                mesh.material.emissiveMap = mesh.material.map;

                // reset transform in scene
                mesh.position.x = 0;
                mesh.position.y = 0;
                mesh.position.z = 0;
                mesh.rotation.x = 0;
                mesh.rotation.y = 0;
                mesh.rotation.z = 0;
                mesh.scale.x = 1;
                mesh.scale.y = 1;
                mesh.scale.z = 1;
            });

            gltf.scene.animations = gltf.animations;
            if (isBase64) {
                assets3d[path] = gltf.scene;
            } else {
                assets3d[asset] = gltf.scene;
            }
            if (onLoad) {
                onLoad();
            }
        }, undefined, function (error) {
            console.error(error);
        });
    };

    /**
     * Check if asset is loaded
     */
    var hasMesh = function (name) {
        if (assets3d[name]) {
            return true;
        }
        return false;
    };

    var load = function (groupName, onReady, onLoaded) {
        // read paths and load fbx files
        var group = Bento.assets.getAssetGroups()[groupName];
        // var asset;
        var assetsLoaded = 0;
        var assetCount = 0;
        var toLoad = [];

        var checkLoaded = function () {
            assetsLoaded++;
            if (assetCount === 0 || (assetCount > 0 && assetsLoaded === assetCount)) {
                onReady(null, groupName);
            }
        };

        var loadAllAssets = function () {
            var i = 0,
                l, data;
            for (i = 0, l = toLoad.length; i < l; ++i) {
                data = toLoad[i];
                if (data) {
                    data.fn(data.asset, data.path, checkLoaded);
                }
            }
            if (toLoad.length === 0) {
                checkLoaded();
            }
        };

        if (!Utils.isDefined(group)) {
            onReady('Could not find mesh group ' + groupName);
            return;
        }

        if (Utils.isDefined(group.fbx)) {
            assetCount += Utils.getKeyLength(group.fbx);
            Utils.forEach(group.fbx, function (asset, key, l, breakLoop) {
                // only add meshes and skip any other file, this will be handled by fbxloader
                if (asset.indexOf('.fbx') > -1 || asset.indexOf('data:application/octet-stream') === 0) {
                    toLoad.push({
                        fn: loadFBX,
                        asset: key,
                        path: group.path === 'base64' ? asset : (group.path + 'fbx/' + asset),
                    });
                } else {
                    assetCount--;
                }
            });
        }
        if (Utils.isDefined(group.gltf)) {
            assetCount += Utils.getKeyLength(group.gltf);
            Utils.forEach(group.gltf, function (asset, assetName, l, breakLoop) {
                // only add gltf files
                if (assetName.indexOf('.gltf') > -1) {
                    toLoad.push({
                        fn: loadGLTF,
                        asset: group.path === 'base64' ? asset : assetName,
                        path: group.path === 'base64' ? assetName : group.path + 'gltf/' + assetName,
                    });
                } else {
                    // bin and png are ignored for now (loaded by GLTFLoader)
                    assetCount--;
                }
            });
        }

        loadAllAssets();
    };

    var manager = {
        getMesh: getMesh,
        hasMesh: hasMesh,
        loadMesh: load,
    };
    Utils.extend(Bento.assets, manager);
    console.log('Assetmanager extended with mesh functions');

    // intercept fbx and gltf loaders
    InlineThreeLoaders.gltf();
    InlineThreeLoaders.fbx();

    return Bento.assets;
});