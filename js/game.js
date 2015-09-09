


bento.require.config({
    baseUrl: 'js'
});

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
        var canvasDimension = AutoResize(new Rectangle(0, 0, 160, 240), 160 - 16, 160 + 32, false);

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
    // add cocoon.js
    setTimeout(function () {
        var script = document.createElement('script');
        script.src = "lib/cocoon.js";
        document.body.appendChild(script);
    }, 0)

    console.log('Starting web version');
})();
/* remove:end */