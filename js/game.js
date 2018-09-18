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
        // for 'pixi', include pixi.js manually in index.html
        var renderer = 'canvas2d';

        // set up a dynamic resolution, e.g. 180~240 x 320
        var landscape = false;
        var baseSize = new Rectangle(0, 0, 180, 320);
        var minWidth = 180;
        var maxWidth = 240;
        // we lock the width by setting min and max the same
        var minHeight = 320;
        var maxHeight = 320; 
        var pixelSize = 3; // we triple pixelSize, which means the

        var canvasDimension = new AutoResize(baseSize, minHeight, maxHeight, landscape);

        // responsive resize callback (useful for development)
        var onResize = function () {
            var viewport = Bento.getViewport();
            var canvas = document.getElementById('canvas');
            var context;

            if (renderer !== 'canvas2d') {
                // responsive resizing only works for canvas2d for now
                return;
            }
            if (!canvas) {
                return;
            }

            context = canvas.getContext('2d');
            //
            canvasDimension = new AutoResize(
                baseSize,
                minHeight,
                maxHeight,
                landscape
            );
            // max/min width
            if (canvasDimension.width > maxWidth) {
                canvasDimension.width = maxWidth;
            }
            if (canvasDimension.width < minWidth) {
                canvasDimension.width = minWidth;
            }

            canvas.width = canvasDimension.width * pixelSize;
            canvas.height = canvasDimension.height * pixelSize;
            viewport.width = canvasDimension.width;
            viewport.height = canvasDimension.height;

            // fit to height
            canvas.style.height = window.innerHeight + 'px';
            canvas.style.width = (viewport.width / viewport.height * window.innerHeight) + 'px';

            // Bento input updates its viewport before this event, so call this manually
            if (Bento.input) {
                Bento.input.updateCanvas();
            }

            // prevent the canvas being blurry after resizing
            if (context.imageSmoothingEnabled) {
                context.imageSmoothingEnabled = false;
            }
            if (context.webkitImageSmoothingEnabled) {
                context.webkitImageSmoothingEnabled = false;
            }
            if (context.mozImageSmoothingEnabled) {
                context.mozImageSmoothingEnabled = false;
            }
            if (context.msImageSmoothingEnabled) {
                context.msImageSmoothingEnabled = false;
            }
        };
        if (renderer === 'canvas2d') {
            onResize();
        }


        // save state setup
        Bento.saveState.setId('EmptyProject/');
        Bento.saveState.saveKeys = true;

        // setup game
        Bento.setup({
            name: 'Empty Project',
            canvasId: 'canvas',
            canvasDimension: canvasDimension,
            renderer: renderer,
            pixelSize: pixelSize,
            manualResize: (renderer === 'canvas2d') ? true : false,
            subPixel: true,
            preventContextMenu: true,
            reload: {
                // DEV ONLY! right mouse click refreshes the current screen with new javascript code
                simple: 'mouseDown-right',
                assets: 'buttonDown-1',
                jump: 'buttonDown-2'
            },
            // DEV ONLY! q downloads a screenshot
            screenshot: 'buttonDown-q',
            // set to false with build script
            dev: true
        }, function () {
            // trigger responsive resize with event listeners
            if (!Utils.isCocoonJs()) {
                window.addEventListener('resize', onResize, false);
                window.addEventListener('orientationchange', onResize, false);
            }
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