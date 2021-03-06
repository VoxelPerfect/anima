/*
 * Copyright 2012 Kostas Karolemeas
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

anima.Level = anima.Scene.extend({

    init:function (id, physicalWidth, gravity) {

        this._super(id);

        this._physicalSize = {
            width:physicalWidth,
            height:null
        };
        this._physicsScale = 1.0;

        this._gravity = gravity;
    },

    load:function () {

        this._super();

        if (this._world) {
            this._world.ClearForces();
        } else {
            this._world = new b2World(
                this._gravity, // gravity
                true  // allow sleep
            );

            if (this._canvas._debug) {
                var debugDraw = new b2DebugDraw();
                debugDraw.SetSprite(this._renderer.getHtml5CanvasContext(this._canvas));
                debugDraw.SetDrawScale(this._physicsScale);
                debugDraw.SetFillAlpha(0.5);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(b2DebugDraw.e_shapeBit
                    | b2DebugDraw.e_jointBit
                    | b2DebugDraw.e_aabbBit
                    | b2DebugDraw.e_pairBit
                    | b2DebugDraw.e_centerOfMassBit
                    | b2DebugDraw.e_controllerBit);

                this._world.SetDebugDraw(debugDraw);
            }

            this._registerContactListener();
        }

        this._nodesWithLogic = [];
        this._dynamicBodies = [];
    },

    setSize:function (postponeTransform) {

        this._super(postponeTransform);

        this._physicsScale = this._size.width / this._physicalSize.width;
        this._physicalSize.height = this._size.height * this._physicalSize.width / this._size.width;
    },

    getWorld:function () {

        return this._world;
    },

    getPhysicsScale:function () {

        return this._physicsScale;
    },

    getPhysicalSize:function () {

        return this._physicalSize;
    },

    isAwake:function () {

        var node;
        for (var id in this._dynamicBodies) {
            node = this._dynamicBodies[id];
            if (node._body.IsAwake()) {
                return true;
            }
        }

        return false;
    },

    /* internal methods */

    _addNodeWithLogic:function (node) {

        if (node.logic) {
            this._nodesWithLogic[this._renderer.getElementId(node)] = node;
        }
    },

    _removeNodeWithLogic:function (node) {

        delete this._nodesWithLogic[this._renderer.getElementId(node)];
    },

    _logic:function () {

        var node;
        for (var id in this._nodesWithLogic) {
            node = this._nodesWithLogic[id];
            node.logic();
        }
    },

    _addDynamicBody:function (node) {

        if (node._body && node._body.GetType() == b2Body.b2_dynamicBody) {
            this._dynamicBodies[this._renderer.getElementId(node)] = node;
        }
    },

    _removeDynamicBody:function (node) {

        delete this._dynamicBodies[this._renderer.getElementId(node)];
    },

    _update:function () {

        var node;
        for (var id in this._dynamicBodies) {
            node = this._dynamicBodies[id];
            if (node._body.IsAwake()) {
                node._update();
            }
        }
    },

    _registerContactListener:function () {

        var me = this;

        var listener = new Box2D.Dynamics.b2ContactListener;

        listener.BeginContact = function (contact) {

            var bodyAId = contact.GetFixtureA().GetBody().GetUserData().id;
            var bodyA = me.getNode(bodyAId);

            var bodyBId = contact.GetFixtureB().GetBody().GetUserData().id;
            var bodyB = me.getNode(bodyBId);

            if (bodyA.onBeginContact) {
                bodyA.onBeginContact(bodyB);
            }
            if (bodyB.onBeginContact) {
                bodyB.onBeginContact(bodyA);
            }
        };

        listener.EndContact = function (contact) {

        };

        listener.PostSolve = function (contact, impulse) {

        };

        listener.PreSolve = function (contact, oldManifold) {

        };

        this._world.SetContactListener(listener);
    }
});