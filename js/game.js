// undefine require
if (window.require) {
    window.require = undefined;
}
if (window.define) {
    window.define = undefined;
}

if (bento.require.config) {
    // requirejs config
    bento.require.config({
        baseUrl: 'js',
        waitSeconds: 0
    });
}

window.startGame = function () {
    bento.require([
        'bento',
        'bento/math/vector2',
        'bento/math/rectangle',
        'bento/tween',
        'bento/autoresize',
        'utils',
        'init'
    ], function (
        Bento,
        Vector2,
        Rectangle,
        Tween,
        AutoResize,
        Utils,
        Init
    ) {
        var canvasDimension = new AutoResize(new Rectangle(0, 0, 160, 284), 240, 284);

        if (!Utils.isCocoonJs() && !Utils.isMobileBrowser()) {
            // on desktop
            canvasDimension = new Rectangle(0, 0, 160, 284);
        }

        Bento.setup({
            name: 'Empty Project',
            canvasId: 'canvas',
            canvasDimension: canvasDimension,
            renderer: 'canvas2d',
            pixelSize: 2,
            subPixel: true,
            preventContextMenu: true,
            reload: {
                simple: 'mouseDown-right',
                assets: 'buttonDown-1',
                jump: 'buttonDown-2'
            },
            screenshot: 'buttonDown-q',
            dev: true
        }, function () {
            Init();
        });
    });
};

// entry points for cordova apps
document.addEventListener('deviceready', function () {
    window.startGame();
}, false);

// since browsers don't fire the deviceready event, we simulate one here
// remove this part during the build process for cordova apps!
/* remove:start */
(function () {
    var event;

    if (navigator.isCocoonJS) {
        return;
    }

    if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("deviceready", true, true);
    } else {
        event = document.createEventObject();
        event.eventType = "deviceready";
    }

    event.eventName = "deviceready";

    if (document.createEvent) {
        document.dispatchEvent(event);
    } else {
        document.fireEvent(event.eventType, event);
    }

    console.log('Starting web version');
})();
/* remove:end */