/*
 * Copyright 2012 Kostas Karolemeas
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

anima.Layer = Class.extend({

    init:function (id) {

        this._id = id;

        this._type = 'Layer';

        this._data = {};

        this._nodes = [];
        this._nodeMap = [];

        this._renderer = anima.defaultRenderer;
    },

    getId:function () {

        return this._id;
    },

    getScene:function () {

        return this._scene;
    },

    getParent:function () {

        return this._scene;
    },

    getElement:function () {

        return this._renderer.getElement(this);
    },

    get:function (propertyName) {

        return this._data[propertyName];
    },

    set:function (propertyName, value) {

        if (value) {
            this._data[propertyName] = value;
        } else {
            delete this._data[propertyName];
        }
    },

    addNode:function (node) {

        if (this._scene._nodeMap[node._id]) {
            anima.log('duplicate node id "' + node._id + '" in scene "' + this._scene._id + '"');
            return;
        }

        node._layer = this;
        node._animator = this._animator;
        node._canvas = this._canvas;

        this._renderer.createElement(this, node);

        this._nodes.push(node);
        this._nodeMap[node._id] = node;

        if (node._renderMode == 'accurate') {
            this._scene._accurateNodes.push(node);
        }

        if (node.logic) {
            node.getLevel()._addNodeWithLogic(node);
        }

        this._scene._nodeMap[node._id] = node;
    },

    getNode:function (id) {

        return this._nodeMap[id];
    },

    removeNode:function (id) {

        var node = this.getNode(id);
        if (node) {
            var count = this._nodes.length;
            for (var i = 0; i < count; i++) {
                if (this._nodes[i]._id == id) {
                    this._nodes.splice(i, 1);
                    delete this._nodeMap[id];
                    node._removeElement();
                    return;
                }
            }
            node._layer = null;

            delete this._scene._nodeMap[node._id];
        }
    },

    getAnimator:function () {

        return this._animator;
    },

    /* internal methods */

    _getImageUrls:function (urls) {

        var count = this._nodes.length;
        for (var i = 0; i < count; i++) {
            this._nodes[i]._getImageUrls(urls);
        }
    },

    _removeElement:function () {

        var count = this._nodes.length;
        for (var i = 0; i < count; i++) {
            this._nodes[i].removeElement();
        }
        this._nodes = [];
        this._nodeMap = [];
    }
});
