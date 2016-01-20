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
        'autoresize',
        'utils'
    ], function (
        Bento,
        Vector2,
        Rectangle,
        Tween,
        AutoResize,
        Utils
    ) {
        var canvasDimension = AutoResize();

        Bento.setup({
            name: 'Empty Project',
            canvasId: 'canvas',
            canvasDimension: canvasDimension,
            assetGroups: {
                'main': 'assets/main.json',
                'preloader': 'assets/preloader.json'
            },
            renderer: 'auto'
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
}

document.addEventListener('deviceready', function () {
    if (navigator.splashscreen) {
        navigator.splashscreen.hide();
        startGame();
    } else {
        startGame();
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