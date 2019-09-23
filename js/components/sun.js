/**
 * Directional light from above, add as a component to be lightweight. We don't need entities for Three
 * @moduleName Sun
 */
bento.define('components/sun', [
    'bento',
    'onigiri/onigiri'
], function (
    Bento,
    Onigiri
) {
    'use strict';
    return function (settings) {
        //directional sun
        var directionalLight = new Onigiri.Light({
            type: THREE.DirectionalLight,
            position: settings.position || new THREE.Vector3(0, 0, 0),
            targetPosition: settings.targetPosition || new THREE.Vector3(0, 0, 0),
            color: settings.color || '#ffffff',
            intensity: settings.directionalIntensity || 0.5
        });

        //extra setup for shadows
        directionalLight.lightObject.castShadow = true;
        directionalLight.lightObject.shadow.radius = 2;
        directionalLight.lightObject.shadow.bias = -0.001;
        directionalLight.lightObject.shadow.mapSize.width = 512;
        directionalLight.lightObject.shadow.mapSize.height = 512;
        directionalLight.lightObject.shadow.camera.left = -3;
        directionalLight.lightObject.shadow.camera.right = 3;
        directionalLight.lightObject.shadow.camera.top = 3;
        directionalLight.lightObject.shadow.camera.bottom = -3;
        directionalLight.lightObject.shadow.camera.near = 0.5;
        directionalLight.lightObject.shadow.camera.far = 25;

        //ambient sun
        var ambientLight = new Onigiri.Light({
            type: THREE.AmbientLight,
            color: settings.color || '#ffffff',
            intensity: settings.ambientIntensity || 0.5
        });

        var light = new Onigiri.Entity3D({
            name: 'sun',
            position: new THREE.Vector3(0, 0, 0),
            components: [
                directionalLight,
                ambientLight
            ]
        });
        return light;
    };
});