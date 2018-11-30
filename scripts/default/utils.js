/* globals module */
// Bento utils
var Utils = {};
Utils.isObject = function (value) {
    return Object.prototype.toString.call(value) === '[object Object]';
};
Utils.isArray = Array.prototype.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
};
Utils.getKeyLength = function (obj) {
    return Object.keys(obj).length;
};
Utils.forEach = function (array, callback) {
    var i;
    var l;
    var stop = false;
    var breakLoop = function () {
        stop = true;
    };
    if (Utils.isArray(array)) {
        for (i = 0, l = array.length; i < l; ++i) {
            callback(array[i], i, l, breakLoop, array[i + 1]);
            if (stop) {
                return;
            }
        }
    } else {
        l = Utils.getKeyLength(array);
        for (i in array) {
            if (!array.hasOwnProperty(i)) {
                continue;
            }
            callback(array[i], i, l, breakLoop);
            if (stop) {
                return;
            }
        }
    }
};
Utils.checksum = function (str) {
    var hash = 0,
        strlen = (str || '').length,
        i,
        c;
    if (strlen === 0) {
        return hash;
    }
    for (i = 0; i < strlen; ++i) {
        c = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

module.exports = Utils;