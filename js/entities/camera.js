bento.define('entities/camera', [
    'bento',
    'bento/math/vector2',
    'bento/entity',
    'utils'
], function (Bento, Vector2, Entity, Utils) {
    'use strict';
    return function () {
        var target = new Vector2(0, 0),
            viewport = Bento.getViewport(),
            cameraSpeed = new Vector2(1, 1),
            shakePos = new Vector2(0, 0),
            shakeTimer = 0,
            shakeDuration = 0,
            shakeStrength = 0,
            shake = function () {
                if (shakeTimer > 0) {
                    shakeTimer -= 1;
                    if (~~(shakeTimer / 1) % 2) {
                        shakePos.x = shakeStrength * (Math.random() - 0.5) * shakeTimer / shakeDuration;
                        shakePos.y = shakeStrength * (Math.random() - 0.5) * shakeTimer / shakeDuration;
                    }
                } else {
                    shakePos.x = 0;
                    shakePos.y = 0;
                }
            },
            camera = new Entity({
                z: Utils.Constants.Layer.CAMERA,
                name: 'camera',
                family: ['camera'],
                updateWhenPaused: true
            }).extend({
                centerTo: function (pos) {
                    target.x = pos.x - viewport.width / 2;
                    target.y = pos.y - viewport.height / 2;
                },
                setSpeed: function (v) {
                    cameraSpeed = v;
                },
                forceTo: function (pos) {
                    var position = camera.getPosition();
                    this.centerTo(pos);
                    position.x = target.x;
                    position.y = target.y;
                },
                shake: function (duration, strength) {
                    shakeTimer = duration;
                    shakeDuration = duration;
                    shakeStrength = strength;
                }
            }).attach({
                update: function (data) {
                    var position = camera.getPosition(),
                        currentScreen = Bento.screens.getCurrentScreen(),
                        screenDimension;
                    if (currentScreen) {
                        screenDimension = currentScreen.getDimension();
                    } else {
                        return;
                    }
                    shake();
                    // move towards target
                    // position.x = Utils.approach(position.x, target.x, cameraSpeed);
                    // position.y = Utils.approach(position.y, target.y, cameraSpeed);
                    position.x += (target.x - position.x) * cameraSpeed.x;
                    position.y += (target.y - position.y) * cameraSpeed.y;
                    // set to scroll
                    viewport.x = Math.min(Math.max(position.x + shakePos.x, 0), screenDimension.width - viewport.width);
                    viewport.y = Math.min(Math.max(position.y + shakePos.y, 0), screenDimension.height - viewport.height);
                    viewport.x = Math.round(viewport.x);
                    viewport.y = Math.round(viewport.y);
                }
            });

        return camera;
    };
});