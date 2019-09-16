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
    /**
     * Describe your settings object parameters
     * @param {Object} settings
     */
    return function (settings) {
        var sun = new Onigiri.Entity3D({
            name: 'sun',
            position: new THREE.Vector3(0, 0, 0),
            components: [
                new Onigiri.Light({
                    type: THREE.DirectionalLight,
                    position: settings.position || new THREE.Vector3(0, 0, 0),
                    targetPosition: settings.targetPosition || new THREE.Vector3(0, 0, 0),
                    color: settings.color || '#ffffff',
                    intensity: settings.directionalIntensity || 0.5
                }),
                new Onigiri.Light({
                    type: THREE.AmbientLight,
                    color: settings.color || '#ffffff',
                    intensity: settings.ambientIntensity || 0.5
                })
            ]
        });
        return sun;
    };
});