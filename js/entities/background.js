bento.define('entities/background', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/tween'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Entity,
    EventSystem,
    Utils,
    Tween
) {
    'use strict';
    return function () {
        var viewport = Bento.getViewport(),
        	entity = new Entity({
        	    z: 0,
        	    name: 'background',
        	    useHshg: false,
        	    position: new Vector2(0, 0),
        	    originRelative: new Vector2(0, 0),
        	    family: [''],
        	    components: [new Sprite({
        	        image: Bento.assets.getImage('background')
        	    })]
        	}) ;

        return entity;


    };
});