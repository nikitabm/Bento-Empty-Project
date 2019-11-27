/**
 * Component description
 * @moduleName Constraint
 * @snippet Constraint.snippet
Constraint({
    class: 'ConeTwistConstraint',
    bodyEntityA: bodyEntityA,
    bodyEntityB: bodyEntityB,
    options: {}
})
 */
bento.define('onigiri/constraint', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/tween',
    'onigiri/physics',
    'onigiri/onigiri'
], function (
    Bento,
    Vector2,
    Rectangle,
    Entity,
    EventSystem,
    Utils,
    Tween,
    Physics,
    Onigiri
) {
    'use strict';
    var currentConstraintId = 0;
    var Constraint = function (settings) {
        // --- Parameters ---
        var constraintId = currentConstraintId;
        var thisClass = settings.class || 'ConeTwistConstraint';
        var bodyEntityA = settings.bodyEntityA;
        var bodyEntityB = settings.bodyEntityB;
        var options = settings.options || {};

        // --- Vars ---
        var constraintAdded = false;
        var entity;

        // --- Component ---
        var component = {
            name: settings.name || 'constraint',
            options: options,
            start: function () {
                if (bodyEntityA && bodyEntityB) {
                    Physics.addConstraint({
                        component: component,
                        cId: constraintId,
                        class: thisClass,
                        bAId: bodyEntityA.id,
                        bBId: bodyEntityB.id,
                        options: options
                    });
                    constraintAdded = true;
                }
            },
            modifyProperty: function (property, operator, value, callback) {
                Physics.modifyConstraintProperty({
                    cId: constraintId,
                    property: property,
                    operator: operator,
                    value: value
                }, callback);
            },
            callMethod: function (method, args, callback) {
                Physics.callConstraintMethod({
                    cId: constraintId,
                    method: method,
                    arguments: args
                }, callback);
            },
            destroy: function (data) {
                if (constraintId && constraintAdded) {
                    Physics.removeConstraint({
                        cId: constraintId
                    });
                }
            },
            attached: function (data) {
                entity = data.entity;
            }
        };

        currentConstraintId++;
        return component;
    };
    Constraint.addToOnigiri = function () {
        Onigiri.Constraint = Constraint;
        console.log("Onigiri: added Onigiri.Constraint");
    };
    return Constraint;
});