/**
 * Global values
 * @moduleName Globals
 */
bento.define('globals', [
    'bento',
    'bento/utils'
], function (
    Bento,
    Utils
) {
    'use strict';
    var Globals = {
        // example of layer definitions
        Layers: {
            CAMERA: -1,
            BACKGROUND: 0,
            PLAYER: 1,
            GUI: 2
        },
        // example of pauselevel definitions
        PauseLevels: {
            NONE: 0,
            PAUSE: 1,
            SYSTEM: 2
        }
    };
    return Globals;
});