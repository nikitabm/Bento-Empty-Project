window.VERSION = '0.0.0';
window.BUILD = 0;
/*replace:version*/
/*replace:build*/

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
        var getEnvironment = function () {
            var environment = 'Web';
            var platform;
            if (navigator.isCocoonJS) {
                environment = 'Cocoon';
                if (window.Cocoon) {
                    environment += ' ' + platform;
                }
            } else if (window.cordova) {
                environment = 'Cordova';
                if (window.device) {
                    environment += ' ' + window.device.platform;
                }
            } else if (window.FBInstant) {
                environment = 'FBInstant';

            }
            return environment;
        };
        console.log('********************');
        console.log('Bento v' + Bento.version);
        console.log('Game v' + window.VERSION + ' b' + window.BUILD);
        console.log('Environment: ' + getEnvironment());
        console.log('********************');

        // save state setup
        Bento.saveState.setId('EmptyProject/');
        Bento.saveState.saveKeys = true;

        // setup game
        Bento.setup({
            name: 'Empty Project',
            canvasId: 'canvas',
            renderer: Utils.isCocoonJs() ? 'canvas2d' : 'pixi',
            pixelSize: 3, // additional scaling
            antiAlias: false,
            useDeltaT: false,
            autoThrottle: false,
            subPixel: true,
            useQueries: true, // add query strings to asset http requests
            preventContextMenu: true, // prevent right-click context menu
            // canvasDimension: new Rectangle(0, 0, 640, 480), // use this if responsiveResize is false
            responsiveResize: {
                landscape: false,
                minWidth: 180,
                maxWidth: 240,
                minHeight: 320, // minimum for iPad -> 240 x 320
                maxHeight: 390, // will fill up for iPhoneX (ratio 19.5:9) -> 180 x 390
            },
            globalMouseUp: false, // recommended true for web builds
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
            Init();
        });
    });
};

// entry points for cordova apps
document.addEventListener('deviceready', function () {
    window.startGame();
}, false);


// other entry point
window.onload = function () {
    var isStarted = false;
    if (navigator.isCocoonJS) {
        // CocoonJs is cordova
        return;
    }
    if (window.cordova) {
        // wait for device ready
        return;
    }


    var beginGame = function () {
        //only start once
        if (!isStarted) {
            isStarted = true;
            window.startGame();

            //dapi needs this for some reason else it won't pass
            if (window.dapi) {
                var value = window.dapi.getAudioVolume();
                window.dapi.addEventListener("audioVolumeChange", function () {
                    console.log('Volume Changed ?');
                });
            }
        }
    };

    var onViewableChange = function () {
        if (!isStarted && window.dapi.isViewable()) {
            //kill listener
            window.dapi.removeEventListener("viewableChange", onViewableChange);
            beginGame();
        }
    };

    var onReady = function () {
        //kill listener
        window.dapi.removeEventListener("ready", onReady);
        // wait until we can view the ad
        if (window.dapi.isViewable()) {
            beginGame();
        } else {
            window.dapi.addEventListener("viewableChange", onViewableChange);
        }
    };

    // playable ads
    // DAPI
    if (window.dapi) {
        if (!window.dapi.isReady()) {
            // note: how long does dapi need for startup? if it takes long, 
            // we should make a loading screen in an html div and remove it when loading is complete
            window.dapi.addEventListener("ready", onReady);
        } else {
            onReady();
        }
        return;
    }

    // MRAID
    if (window.mraid) {
        var isStartedMRAID = false;
        if (window.mraid.getState() === 'loading') {
            // note: how long does mraid need for startup? if it takes long, 
            // we should make a loading screen in an html div and remove it when loading is complete
            window.mraid.addEventListener("ready", function () {
                if (!isStartedMRAID) {
                    window.startGame();
                    isStartedMRAID = true;
                }
            });
        } else {
            window.startGame();
            isStartedMRAID = true;
        }
        return;
    }

    beginGame();
};