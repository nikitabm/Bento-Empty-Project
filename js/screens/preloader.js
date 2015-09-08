bento.define('screens/preloader', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/components/fill',
    'bento/entity',
    'bento/utils',
    'bento/tween',
    'bento/screen'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Fill,
    Entity,
    Utils,
    Tween,
    Screen
) {
    'use strict';
    var object = Screen({
        dimension: Bento.getViewport()
    });
    Utils.extend(object, {
        onShow: function () {
            var viewport = Bento.getViewport(),
                loaded = false,
                time = 0,
                timeout = 0,
                background = Entity({
                    z: 0,
                    name: 'background',
                    components: [Fill],
                    addNow: true,
                    init: function () {}
                }),
                luckyKat = Entity({
                    z: 1,
                    name: 'lucky',
                    position: Vector2(viewport.width / 2, viewport.height / 2),
                    originRelative: Vector2(0.5, 0.5),
                    components: [Sprite],
                    family: [''],
                    sprite: {
                        image: Bento.assets.getImage('luckykat-160'),
                    },
                    addNow: true,
                    init: function () {
                        //this.scale.setScale(Vector2(2, 2));
                    }
                }).attach({
                    update: function () {
                        time += 1;
                        if (time > timeout) {
                            end();
                        }
                    }
                }),
                end = function () {
                    if (loaded && time > timeout) {
                        Bento.screens.show('screens/main');
                    }
                };
            object.base.onShow();
            Bento.assets.load('main', function (err) {
                console.log('Main assets loaded')
                loaded = true;
                end();
            }, function (current, total) {
                console.log(current + '/' + total);
            });
        }
    });
    return object;
});