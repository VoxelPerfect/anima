/*
 * Copyright 2012 Kostas Karolemeas
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var anima = {};

anima.version = '0.9.6 build 2';

anima.isIE = false;
anima.isIE8 = false;
if ($.browser.msie) {
    anima.isIE = true;
    var version = parseInt($.browser.version[0]);
    anima.isIE8 = (version <= 8);
}

anima.cssVendorPrefix = '';
anima.cssTransitionEndEvent = '';
if ($.browser.webkit || $.browser.safari) {
    anima.cssVendorPrefix = '-webkit-';
} else if ($.browser.mozilla) {
    anima.cssVendorPrefix = '-moz-';
} else if ($.browser.opera) {
    anima.cssVendorPrefix = '-o-';
} else if ($.browser.msie) {
    anima.cssVendorPrefix = '-ms-';
}

anima.cssTransitionEndEvent = null;
if ($.support.cssTransitions) {
    if ($.browser.webkit || $.browser.safari) {
        anima.cssTransitionEndEvent = 'webkitTransitionEnd';
    } else if ($.browser.mozilla) {
        anima.cssTransitionEndEvent = 'transitionend';
    } else if ($.browser.opera) {
        anima.cssTransitionEndEvent = 'oTransitionEnd';
    } else if ($.browser.msie) {
        anima.cssTransitionEndEvent = 'MSTransitionEnd';
    } else {
        anima.cssTransitionEndEvent = 'transitionend';
    }
}

anima.isWebkit = ($.browser.webkit || $.browser.safari);

anima.frameRate = 60; // fps
anima.physicsFrameRate = anima.frameRate;

anima._userAgent = navigator.userAgent.toLowerCase();

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, callbackCode) {
                if (!$.browser.msie) {
                    window.setTimeout(callback, 1000 / anima.frameRate);
                } else {
                    window.setTimeout(callbackCode, 1000 / anima.frameRate);
                }
            };
    })();
}

anima.getRequestParameter = function (name, defaultValue) {

    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return defaultValue;
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
};

anima.debug = anima.getRequestParameter('debug');

anima.log = null;
anima.logException = null;
if (anima.isIE) {
    anima.log = function (msg) {
        if (anima.debug) {
            alert(msg);
        }
    };
    anima.logException = function (e) {
        anima.log(e);
    };

} else {
    anima.log = function (msg) {
        console.log(msg);
        if (msg.stack) {
            console.log(msg.stack);
        }
    };
    anima.logException = function (e) {
        if (console.exception) {
            console.exception(e);
        } else {
            anima.log(e);
        }
    };
}

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) == 0;
    };
}

anima.nowTime = function () {

    return new Date().getTime();
};

anima.isArray = function (value) {

    return $.isArray(value);
}

anima.isNumber = function (value) {

    return $.type(value) === "number";
};

anima.isString = function (value) {

    return $.type(value) === "string";
};

anima.isObject = function (value) {

    return $.isPlainObject(value);
};

anima.isVisible = function (element$) {

    return element$ ? (element$.css("display") != "none") : false;
};

anima.isMapEmpty = function (map) {

    var name;
    for (name in map) {
        return false;
    }
    return true
};

anima.getMapSize = function (map) {

    var count = 0;
    for (name in map) {
        count++;
    }
    return count;
};

anima.clone = function (obj) {

    return $.extend({}, obj);
};

// ultra fast rounding (tip: inline for max. performance)
anima.round = function (value) {

    return ((value + 0.5) << 0);
};

anima.toDegrees = function (radians) {

    return radians * 180.0 / Math.PI;
}

anima.toRadians = function (degrees) {

    return degrees * Math.PI / 180.0;
}

anima.preventDefault = function (event) {

    if (anima.isIE) {
        event.returnValue = false;
    } else if (event.preventDefault) {
        event.preventDefault();
    }
}

anima.getScript = function (url, options) {

    options = $.extend(options || {}, {
        dataType:"script",
        cache:true,
        url:url
    });

    return $.ajax(options);
};

anima.formatDate = function (date1) {

    return date1.getFullYear() + '-' +
        (date1.getMonth() < 9 ? '0' : '') + (date1.getMonth() + 1) + '-' +
        (date1.getDate() < 10 ? '0' : '') + date1.getDate();
}

anima.allowNumbersOnly = function (event) {

    // Allow: backspace, delete, tab and escape
    if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 ||
        // Allow: Ctrl+A
        (event.keyCode == 65 && event.ctrlKey === true) ||
        // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        // let it happen, don't do anything
        return;
    }
    else {
        // Ensure that it is a number and stop the keypress
        if ((event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
            event.preventDefault();
        }
    }
}

anima.isValidEmail = function (email) {

    var emailReg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return emailReg.test(email);
}

anima.parseDate = function (str) {

    var date = null;
    try {
        date = Date.parse(str);
    } catch (e) {
    }
    return date;
}

anima.loadXML = function (file, callback) {

    return $.get(file, null, function (data, textStatus, jqXHR) {
        if (callback) {
            callback($(data));
        }
    }, 'xml');
}

anima.ext = {};

var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
    b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
    b2PI = Box2D.Common.Math.PI;

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// http://ejohn.org/blog/simple-javascript-inheritance/
// http://blog.buymeasoda.com/understanding-john-resigs-simple-javascript-i
// Inspired by base2 and Prototype
// IE8 fixes by Kostas Karolemeas
(function () {
    var initializing = false;

    // Test for methods including _super calls
    var fnTest = anima.isIE8 ? {test:function () {
        return true;
    }} : /xyz/.test((function () {
        xyz;
    }).toString()) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function () {
    };

    // Create a new Class that inherits from this class
    Class.extend = function (prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function (name, fn) {
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init)
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

/* Performance Statistics */

anima._statsLevel = anima.getRequestParameter('stats', 'none');

anima.stats = {};

anima.stats._nopMonitor = {
    begin:function () {
    },
    end:function () {
    }
};

anima._createStatsMonitor = function (name, mode, y) {

    var monitor = null;
    if (Stats) {
        monitor = new Stats(name);
        monitor.setMode(mode); // 0: fps, 1: ms

        monitor.domElement.style.position = 'absolute';
        monitor.domElement.style.left = '0px';
        monitor.domElement.style.top = y + 'px';

        document.body.appendChild(monitor.domElement);
    } else {
        monitor = anima.stats._nopMonitor;
    }

    return monitor;
};

anima.initializeStats = function () {

    var yStep = 45;

    var level = anima._statsLevel;

    anima.stats.total = (level == 'all' || level == 'fps') ? anima._createStatsMonitor(null, 0, 0) : anima.stats._nopMonitor;
    anima.stats.physics = (level == 'all') ? anima._createStatsMonitor('P', 1, 1 * yStep) : anima.stats._nopMonitor;
    anima.stats.logic = (level == 'all') ? anima._createStatsMonitor('L', 1, 2 * yStep) : anima.stats._nopMonitor;
    anima.stats.update = (level == 'all') ? anima._createStatsMonitor('U', 1, 3 * yStep) : anima.stats._nopMonitor;
    anima.stats.animate = (level == 'all') ? anima._createStatsMonitor('A', 1, 4 * yStep) : anima.stats._nopMonitor;
};

/**
 * http://kangax.github.com/iseventsupported/
 */
anima.isEventSupported = (function () {

    var TAGNAMES = {
        'select':'input', 'change':'input',
        'submit':'form', 'reset':'form',
        'error':'img', 'load':'img', 'abort':'img'
    };

    function isEventSupported(eventName, element) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        var isSupported = (eventName in element);

        if (!isSupported) {
            // if it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
            if (!element.setAttribute) {
                element = document.createElement('div');
            }
            if (element.setAttribute && element.removeAttribute) {
                element.setAttribute(eventName, '');
                isSupported = typeof element[eventName] == 'function';

                // if property was created, "remove it" (by setting value to `undefined`)
                if (typeof element[eventName] != 'undefined') {
                    element[eventName] = undef;
                }
                element.removeAttribute(eventName);
            }
        }

        element = null;
        return isSupported;
    }

    return isEventSupported;
})();

anima.hasTouchEvents = anima.isEventSupported('touchstart');

