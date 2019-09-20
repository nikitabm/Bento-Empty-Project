bento.define('onigiri/collisions', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/components/sprite',
    'bento/components/clickable',
    'bento/entity',
    'bento/eventsystem',
    'bento/gui/clickbutton',
    'bento/gui/counter',
    'bento/gui/text',
    'bento/utils',
    'bento/tween',
    'onigiri/onigiri'
], function (
    Bento,
    Vector2,
    Rectangle,
    Sprite,
    Clickable,
    Entity,
    EventSystem,
    ClickButton,
    Counter,
    Text,
    Utils,
    Tween,
    Onigiri
) {
    'use strict';
    var debug = true;

    // collider types are derived from this
    var Collider = function (settings) {
        // --- Parameters ---
        var type = settings.type;
        var shape = settings.shape;

        // --- Variables ---
        var parent;
        var helper;
        var collidedThisFrame = false;
        var uncollidedColor;

        // --- Functions ---
        /**
     * Onigiri equivelant to entity.getBoundingBox returning a world scaled and translated Three Math shape 
     * @function
     * @instance
     * @param {THREE.Vector3} [offset] - An offset in world units that the shape will be moved by
     * @name collidesWith
     * @snippet #Collider.getShape|Entity/Array
getShape(new THREE.THREE.Vector3(0, 0, 0))
     * @returns {Sphere/Box} The scaled and translated Mathematical shape
     */
        var getShape = function (offset) {
            //set default for offset
            offset = offset || new THREE.Vector3(0, 0, 0);

            // copy the base shape
            var transformedShape = shape.clone();

            // get transforms
            var position = new THREE.Vector3(0, 0, 0);
            var scale = new THREE.Vector3(1, 1, 1);
            if (parent) {
                if (parent.object3D) {
                    parent.object3D.getWorldPosition(position);
                    parent.object3D.getWorldScale(scale);
                }
            }

            switch (type) {
            case 'box':
                transformedShape.min.multiply(scale);
                transformedShape.max.multiply(scale);
                transformedShape.translate(position);
                if (helper) {
                    helper.box.min = transformedShape.min;
                    helper.box.max = transformedShape.max;
                }
                break;
            case 'sphere':
                transformedShape.radius *= Math.max(scale.x, scale.y);
                transformedShape.translate(position);
                if (helper) {
                    transformedShape.getBoundingBox(helper.box);
                }
                break;
            }
            return transformedShape;
        };

        //checks if this collder intersects another collider
        var intersects = function (otherCollider, offset) {
            var didCollide = false;
            switch (otherCollider.type) {
            case 'box':
                didCollide = collider.getShape(offset).intersectsBox(otherCollider.getShape());
                break;
            case 'sphere':
                didCollide = collider.getShape(offset).intersectsSphere(otherCollider.getShape());
                break;
            }
            if (didCollide) {
                return otherCollider;
            } else {
                return null;
            }
        };

        /**
     * Checks if thiscollider is colliding with another entity's or group of entities' colliders
     * @function
     * @instance
     * @param {Object} settings
     * @param {Entity} settings.entity - The other entity
     * @param {Array} settings.entities - Or an array of entities to check with
     * @param {String} settings.family - Or the name of the family to collide with
     * @param {Entity} settings.rectangle - Or if you want to check collision with a shape directly instead of entity
     * @param {Vector2} [settings.offset] - A position offset
     * @param {CollisionCallback} [settings.onCollide] - Called when entities are colliding
     * @param {Boolean} [settings.firstOnly] - For detecting only first collision or more, default true
     * @name collidesWith
     * @snippet #Collider.collidesWith|Entity/Array
collidesWith({
    entity: obj, // when you have the reference
    entities: [], // or when colliding with this array
    family: '', // or when colliding with a family
    offset: new THREE.Vector3(0, 0, 0), // offset the collision check on original entity's position
    ignoreSelf: true, // don't detect self
    firstOnly: true, // onCollide stops after having found single collision 
    onCollide: function (other) { // fires for every successful collision
        // other is the other collder we collided with
        // onCollide is not called if no collision occurred 
    }
})
     * @returns {Array} The collided entities, otherwise null
     */
        var collidesWith = function (params) {
            var offset = params.offset || new THREE.Vector3(0, 0, 0);
            var ignoreSelf = params.ignoreSelf || false;
            var firstOnly = params.firstOnly || false;
            var onCollide = params.onCollide;
            var intersectedColliders = [];

            var checkCollision = function (otherCollider) {
                if (ignoreSelf && otherCollider.parent && collider.parent && collider.parent.id === otherCollider.parent.id) {
                    return null; // ignore self if we need to
                }
                var collisionResult = intersects(otherCollider, offset);
                if (collisionResult) {
                    intersectedColliders.push(collisionResult);
                    if (onCollide) {
                        onCollide(collisionResult);
                    }
                }
                return collisionResult;
            };
            var loopEntityArray = function (entityArray) {
                Utils.forEach(entityArray, function (entity, i, l, breakLoop) {
                    if (checkCollision(entity.getComponent('collider'))) {
                        if (firstOnly) {
                            breakLoop();
                        }
                    }
                });
            };

            if (params.entity) { // a specific entity
                checkCollision(params.entity.getComponent('collider'));
            } else if (params.entities) { // an array of entities
                loopEntityArray(params.entities && params.entities.length > 0);
            } else if (params.family && params.family.length > 0) { // a family
                loopEntityArray(Bento.objects.getByFamily(params.family));
            }
            if (intersectedColliders.length > 0) {
                collidedThisFrame = true;
                return intersectedColliders;
            } else {
                return null;
            }

        };

        var collider = {
            name: 'collider',
            type: type,
            shape: shape,
            onParentAttached: function (data) {
                parent = data.entity;
            },
            start: function () {
                if (helper) {
                    Onigiri.scene.add(helper);
                }
                EventSystem.on('postUpdate', this.postUpdate);
            },
            destroy: function () {
                if (helper) {
                    Onigiri.scene.remove(helper);
                }
                EventSystem.off('postUpdate', this.postUpdate);
            },
            postUpdate: function (data) {
                if (helper) {
                    if (collidedThisFrame) {
                        helper.material.color = new THREE.Color(0xff0000);
                    } else {
                        helper.material.color = new THREE.Color(uncollidedColor);
                    }
                    collidedThisFrame = false;
                    getShape();
                }
            },
            getShape: getShape,
            collidesWith: collidesWith
        };

        // --- Pre Setup ---
        if (debug) {
            switch (type) {
            case 'box':
                uncollidedColor = 0xffff00; // yellow as box
                break;
            case 'sphere':
                uncollidedColor = 0x00ffff; // cyan as sphere
                break;
            }
            helper = new THREE.Box3Helper(new THREE.Box3(), uncollidedColor);
        }

        return collider;
    };

    /* @snippet BoxCollider - Onigiri
    Onigiri.BoxCollider(new THREE.Box3(min, max));
    */
    Onigiri.BoxCollider = function (box) {
        return new Collider({
            type: 'box',
            shape: box || new THREE.Box3()
        });
    };
    /* @snippet SphereCollider - Onigiri
        Onigiri.SphereCollider(new THREE.Sphere(center, radius));
        */
    Onigiri.SphereCollider = function (sphere) {
        return new Collider({
            type: 'sphere',
            shape: sphere || new THREE.Sphere()
        });
    };
    console.log("Onigiri: added Onigiri.BoxCollider");
    console.log("Onigiri: added Onigiri.SphereCollider");
});