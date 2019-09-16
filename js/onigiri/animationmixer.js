bento.define('onigiri/animationmixer', [
    'bento/utils',
    'onigiri/onigiri'
], function (
    Utils,
    Onigiri
) {
    'use strict';
    /* @snippet AnimationMixer - Onigiri
    Onigiri.AnimationMixer({
        object3D: $ {1},
        startAnimation: '${2}'
    }) */
    Onigiri.AnimationMixer = function (settings) {
        // --- Parameters ---
        var defaultAnimation = settings.defaultAnimation;

        // --- Variables ---
        var mixer;
        var animationNames = [];
        var animationSequence = {};

        // --- Component ---
        var mixerComponent = {
            name: 'mixerComponent',
            animationSpeed: settings.animationSpeed || 1,
            object3D: settings.object3D,
            start: function (data) {
                // find object3D if it doesn't exist
                if (!this.object3D) {
                    this.object3D = this.parent.object3D;
                }
                if (this.object3D.animations) {
                    mixer = new THREE.AnimationMixer(this.object3D);
                    this.processAnimations();
                    if (defaultAnimation && this.hasAnimation(defaultAnimation)) {
                        this.startAnimation(defaultAnimation); // start the defaul animation
                    }
                }
            },
            update: function (data) {
                if (mixer) {
                    mixer.update((1 / 60) * this.animationSpeed * data.speed); // update the animation
                }
            },
            processAnimations: function () {
                var stripped, lastIndex;
                Utils.forEach(this.object3D.animations, function (animation, i) {
                    lastIndex = animation.name.lastIndexOf('|') + 1;
                    stripped = animation.name.substring(lastIndex);
                    if (!stripped) {
                        return;
                    }
                    if (!animationSequence[stripped]) {
                        animationSequence[stripped] = [];
                        animationNames.push(stripped);
                    }
                    animationSequence[stripped].push(i);
                });
            },
            hasAnimation: function (animation) {
                return animationNames.indexOf(animation) > -1;
            },
            getAnimations: function () {
                return [].concat(animationNames);
            },
            startAnimation: function (animation) {
                var i, action, clip, sequence;
                sequence = animationSequence[animation];
                if (sequence) {
                    for (i = 0; i < sequence.length; i++) {
                        clip = this.object3D.animations[sequence[i]];
                        action = mixer.clipAction(clip);
                        action.play();
                    }
                }
            },
            stop: function () {
                mixer.stopAllAction();
            }
        };
        return mixerComponent;
    };
    console.log("Onigiri: added Onigiri.AnimationMixer");
});