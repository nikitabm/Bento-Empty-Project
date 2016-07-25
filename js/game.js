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
        'utils'
    ], function (
        Bento,
        Vector2,
        Rectangle,
        Tween,
        AutoResize,
        Utils
    ) {
        var canvasDimension = AutoResize(new Rectangle(0, 0, 160, 284), 240, 284);
        
        if (!window.Cocoon && !Utils.isMobile()) {
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
            dev: true
        }, function () {
            // cocoonjs
            if (Utils.isCocoonJS() && window.Cocoon) {
                window.Cocoon.Utils.setAntialias(false);
            }
            Bento.assets.load('preloader', function (err) {
                Bento.screens.show('screens/preloader');
            });
        });
    });
};

document.addEventListener('deviceready', function () {
    if (navigator.splashscreen) {
        navigator.splashscreen.hide();
        window.startGame();
    } else {
        window.startGame();
    }
}, false);

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