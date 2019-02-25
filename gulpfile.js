/**
 * Default build tasks are here
 */
require('./scripts/default/index');

// Automatically more folders with gulp tasks
var path = require('path');
var fs = require('fs');

fs.readdirSync(path.join('scripts')).forEach(function (name) {
    var filePath = path.join(path.join('scripts'), name);
    var stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
        // find a file called tasks.js and read it
        var tasks = path.join(filePath, 'index.js');
        if (fs.existsSync(tasks)) {
            require('./scripts/' + name + '/index');
        }
    }
});
