/*
 * Copyright 2012 Kostas Karolemeas
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

anima._canvases = [];

anima.Canvas = anima.Node.extend({

    init:function (id, debug, adaptive) {

        this._super(id);

        this._type = 'Canvas';

        this._renderer.createCanvas(this);

        this._animator = new anima.Animator(this, adaptive);

        this._scenes = [];
        this._sceneMap = [];
        this._currentScene = null;

        anima._canvases.push(this);

        this._debug = debug;
        if (debug) {
            this._renderer.addHtml5Canvas(this);
        }
    },

    getParent:function () {

        return null;
    },

    getCanvas:function () {

        return this._canvas;
    },

    addScene:function (scene) {

        scene._canvas = this;
        scene._animator = this._animator;
        scene._canvas = this;

        this._renderer.createElement(this, scene);
        scene.hide();

        this._scenes.push(scene);
        this._sceneMap[scene._id] = scene;

        scene.setSize();
    },

    getScene:function (id) {

        return this._sceneMap[id];
    },

    setCurrentScene:function (id, duration, callbackFn, progressFn) {

        if (!progressFn) {
            progressFn = anima.defaultProgressReporter;
        }

        var newScene = this.getScene(id);
        if (newScene) {
            newScene.load();

            var me = this;
            this._loadImages(newScene, progressFn, function () {
                if (!duration) {
                    duration = 500;
                }

                newScene._renderer.updateTransform(newScene);
                if (me._currentScene) {
                    me._animator.clearAnimations();
                    me._currentScene.fadeOut(duration, function () {
                        newScene.fadeIn(duration, callbackFn);
                        me._currentScene = newScene;
                    });
                } else {
                    newScene.fadeIn(duration, callbackFn);
                    me._currentScene = newScene;
                }
            });
        }
    },

    getCurrentScene:function () {

        return this._currentScene;
    },

    removeScene:function (id) {

        var scene = this.getScene();
        if (scene) {
            var count = this._scenes.length;
            for (var i = 0; i < count; i++) {
                if (this._scenes[i]._id == id) {
                    this._scenes.splice(i, 1);
                    delete this._sceneMap[id];
                    scene._removeElement();
                    return;
                }
            }
            scene._canvas = null;
        }
    },

    setSize:function (width, height) {

        this._super(width, height, true);
        this._resize();
    },

    /* internal methods */

    _getScaledBox:function () {

        if (!this._position) {
            return null;
        }

        var me = this;
        return {
            x:me._position.x,
            y:me._position.y,
            width:me._size.width * me._scale.x,
            height:me._size.height * me._scale.y
        };
    },

    _FIXED_TIMESTEP:1.0 / anima.physicsFrameRate,
    _MINIMUM_TIMESTEP:1.0 / (anima.physicsFrameRate * 10.0),
    _VELOCITY_ITERATIONS:7,
    _POSITION_ITERATIONS:7,
    _MAXIMUM_NUMBER_OF_STEPS:anima.frameRate,

    _step:function (level) {

        var world = level._world;

        /**/ anima.stats.physics.begin();
        if (anima.physicsFrameRate > anima.frameRate) {
            var frameTime = 1.0 / anima.frameRate;
            var stepsPerformed = 0;
            while ((frameTime > 0.0) && (stepsPerformed < this._MAXIMUM_NUMBER_OF_STEPS)) {
                var deltaTime = Math.min(frameTime, this._FIXED_TIMESTEP);
                frameTime -= deltaTime;
                if (frameTime < this._MINIMUM_TIMESTEP) {
                    deltaTime += frameTime;
                    frameTime = 0.0;
                }

                try {
                    world.Step(deltaTime, this._VELOCITY_ITERATIONS, this._POSITION_ITERATIONS);
                } catch (e) {
                    anima.logException(e);
                }

                stepsPerformed++;
            }
        } else {
            try {
                world.Step(1.0 / anima.frameRate, this._VELOCITY_ITERATIONS, this._POSITION_ITERATIONS);
            } catch (e) {
                anima.logException(e);
            }
        }
        /**/ anima.stats.physics.end();

        /**/ anima.stats.logic.begin();
        try {
            level._logic();
        } catch (e) {
            anima.logException(e);
        }
        /**/ anima.stats.logic.end();

        if (this._debug) {
            level._world.DrawDebugData(true);
        }
        world.ClearForces();
    },

    _update:function () {

        try {
            /**/ anima.stats.total.begin();

            var scene = this._currentScene;
            if (scene && scene._world) {
                var sleeping = !scene.isAwake();
                if (!sleeping) {
                    this._step(scene);
                }

                if (!sleeping) {
                    /**/ anima.stats.update.begin();
                    scene._update();
                    /**/ anima.stats.update.end();
                }

                /**/ anima.stats.animate.begin();
                this._animator.animate();
                /**/ anima.stats.animate.end();
                /**/ anima.stats.total.end();

                return;
            }

            /**/ anima.stats.animate.begin();
            this._animator.animate();
            /**/ anima.stats.animate.end();
            /**/ anima.stats.total.end();
        } catch (e) {
            anima.logException(e);
        }
    },

    _resize:function () {

        var sourceWidth = this._size.width;
        var sourceHeight = this._size.height;

        var containerSize = this._renderer.getParentElementSize(this);
        var targetWidth = containerSize.width;
        var targetHeight = containerSize.height;

        var offsetX = 0;
        var offsetY = 0;
        var width = targetWidth;

        var requiredWidth = sourceWidth * targetHeight / sourceHeight;
        if (requiredWidth < targetWidth) {
            offsetX = (targetWidth - requiredWidth) / 2;
            width = requiredWidth;
        } else {
            var requiredHeight = sourceHeight * targetWidth / sourceWidth;
            offsetY = (targetHeight - requiredHeight) / 2;
        }

        var scale = width / sourceWidth;

        this._origin = {
            x:0,
            y:0
        };
        this._position = {
            x:offsetX,
            y:offsetY
        };
        this._scale = {
            x:scale,
            y:scale
        };

        this._renderer.updateAll(this);

        if (this._currentScene) {
            this._currentScene._renderer.updateTransform(this._currentScene);
        }
    },

    _loadImages:function (scene, progressFn, callbackFn) {

        $.mobile.showPageLoadingMsg();

        var urls = [];
        try {
            scene._getImageUrls(urls);
        } catch (e) {
            console.log(e);
            $.mobile.hidePageLoadingMsg();
            return;
        }
        var totalImages = urls.length;
        if (totalImages == 0) {
            $.mobile.hidePageLoadingMsg();
            if (callbackFn) {
                callbackFn.call();
            }
            return;
        }
        var image;
        var loadedImages = 0;
        for (var i = 0; i < totalImages; i++) {
            image = new Image();
            image.onload = function () {
                loadedImages++;

                if (progressFn) {
                    progressFn(anima.round(loadedImages * 100.0 / totalImages));
                }
                if (loadedImages >= totalImages) {
                    $.mobile.hidePageLoadingMsg();
                    if (callbackFn) {
                        callbackFn.call();
                    }
                }

                image = null;
            };
            image.src = urls[i];
        }
    }
});

anima.defaultProgressReporter = function (percent) {

    var loadIcon$ = $('.ui-loader .ui-icon-loading');
    loadIcon$.html('<div class="progress-percent">' + percent + '</div>');
}

anima._resizeCanvas = function (animator, animation) {
    animation.data.canvas._resize();
};
anima.onResize = function () {

    var canvas;
    for (var i in anima._canvases) {
        canvas = anima._canvases[i];
        canvas.getAnimator().addTask(anima._resizeCanvas, null, {
            canvas:canvas
        });
    }
};

$(window).resize(function () {

    anima.onResize();
});

$(window).bind('orientationchange', function (event, orientation) {

    anima.onResize();
});

function _anima_update() {

    window.requestAnimationFrame(_anima_update, '_anima_update()');

    for (var i in anima._canvases) {
        anima._canvases[i]._update();
    }
}

anima.start = function (callbackFn) {

    $.mobile.loadingMessageTextVisible = false;

    anima.initializeStats();

    anima._initializeSound(function () {
        anima.onResize();
        _anima_update();

        if (callbackFn) {
            callbackFn.call();
        }
    });
};
