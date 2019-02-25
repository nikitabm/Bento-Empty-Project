/* jshint undef: true */
/* globals process */
var gulp = require('gulp');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

// http://stackoverflow.com/a/26038979/5930772
var copyFileSync = function (source, target) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
};
var copyFolderRecursiveSync = function (source, target) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
};
// http://stackoverflow.com/a/32197381/5930772
var deleteFolderRecursive = function (source) {
    if (fs.existsSync(source)) {
        fs.readdirSync(source).forEach(function (file, index) {
            var curPath = path.join(source, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(source);
    }
};

/**
 * Executes a cordova command with logs
 * @param {Array} args - an array with arguments,
 * for example "cordova platform add ios" --> execCordova(['platform', 'add', 'ios'])
 * @param {Function} [onComplete] - execute after completion
 */
var isWindows = /^win/.test(process.platform);
var execCordova = function (args, onComplete) {
    var task = spawn('cordova' + (isWindows ? '.cmd' : ''), args, {
        // cwd: isWindows ? path.join('.') : path.join('cordova'),
        stdio: "inherit"
    });
    task.on('exit', function (code) {
        console.log('Exited with code ' + code.toString());
        if (onComplete) {
            onComplete();
        }
    });
};
/**
 * Executes a general command with logs
 * @param {String} cmd - The command
 * @param {Array} args - an array with arguments
 * @param {Function} [onComplete] - execute after completion
 */
var execCommand = function (cmd, args, onComplete) {
    var hasExe = cmd.indexOf('.exe') >= 0;
    var task = spawn(cmd + ((isWindows && !hasExe) ? '.cmd' : ''), args, {
        stdio: "inherit"
    });

    task.on('exit', function (code) {
        console.log('Exited with code ' + code.toString());
        if (onComplete) {
            onComplete();
        }
    });
};
/**
 * Adds plugin from local folder
 * Seems execCordova can't be used to install local plugins
 */
// var pluginAdd = function (path, onComplete) {
//     // for some reason editing config.xml or using spawn is not working while gulp is running?
//     exec('cordova plugin add "' + path + '" --save', {
//         cwd: 'cordova'
//     }, function (error, stdout, stderr) {
//         // log output
//         console.log(stdout);
//         console.error(stderr);

//         if (error) {
//             console.log('Error:' + error.toString());
//             return;
//         }
//         if (onComplete) {
//             onComplete();
//         }
//     });
// };
/**
 * Copy build folder to www folder
 */
var copyBuildToIosWww = function () {
    console.log('Copy build to ios www');
    // copies build directly to platform www
    if (fs.existsSync(path.join('platforms', 'ios'))) {
        // delete js folders
        deleteFolderRecursive(path.join('platforms', 'ios', 'www', 'js'));
        copyFolderRecursiveSync(
            path.join('www'),
            path.join('platforms', 'ios')
        );
    }
};
var copyBuildToAndroidWww = function () {
    console.log('Copy build to android www');
    // copies build directly to platform www
    if (fs.existsSync(path.join('platforms', 'android'))) {
        // delete js folders for any leftover cdf file
        deleteFolderRecursive(path.join('platforms', 'android', 'assets', 'www', 'js'));
        copyFolderRecursiveSync(
            path.join('www'),
            path.join('platforms', 'android', 'assets')
        );
    }
};

/**
 * Extracts name and versions
 */
var getXmlInfo = function () {
    // note: parsing might be better with the etree node module
    var xml;
    var info = {};
    var start, end;
    // read config.xml from root folder
    xml = fs.readFileSync(path.join('config.xml'), 'utf-8');

    // parse name
    start = xml.indexOf('<name>');
    end = xml.indexOf('</name>', start + ('<name>').length);
    if (start >= 0 && end >= 0) {
        info.name = xml.substring(start + ('<name>').length, end);
    }

    // parse version
    start = xml.indexOf('version="', xml.indexOf('widget')); // the first line states xml version
    end = xml.indexOf('"', start + ('version="').length);
    if (start >= 0 && end >= 0) {
        info.version = xml.substring(start + ('version="').length, end);
    }

    // parse android build
    start = xml.indexOf('android-versionCode="');
    end = xml.indexOf('"', start + ('android-versionCode="').length);
    if (start >= 0 && end >= 0) {
        info.build = xml.substring(start + ('android-versionCode="').length, end);
    }

    // parse ios build
    start = xml.indexOf('ios-CFBundleVersion="');
    end = xml.indexOf('"', start + ('ios-CFBundleVersion="').length);
    if (start >= 0 && end >= 0) {
        info.buildIos = xml.substring(start + ('ios-CFBundleVersion="').length, end);
    }

    // parse bundle id
    start = xml.indexOf('id="com');
    end = xml.indexOf('"', start + ('id="').length);
    if (start >= 0 && end >= 0) {
        info.bundleId = xml.substring(start + ('id="').length, end);
    }

    return info;
};

/**
 * Installs the game with the version and build number corresponding to the one in config.xml.
 * When install is finished, the game is automatically started
 */
var installAndroid = function (onComplete) {
    var info = getXmlInfo();
    var fileName = info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + '.apk';
    var filePath = path.join('build', fileName);

    if (!fs.existsSync(filePath)) {
        // try again with debug
        var fileDebug = info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + '-debug.apk';
        filePath = path.join('build', fileDebug);
        if (!fs.existsSync(filePath)) {
            console.error("Could not find apk " + fileName);
            return;
        }
    }

    var task = spawn('adb', ['install', '-r', '-d', filePath], {
        stdio: 'inherit'
    });

    task.on('exit', function (code) {
        var str = code === 0 ? "Installation completed successfully!" : "Error during installation";
        console.log(str);

        if (code !== 0) {
            return;
        }
        if (onComplete) {
            onComplete();
        }
    });
};
/**
 * Runs the game on the device.
 */
var runAndroid = function () {
    var info = getXmlInfo();

    console.log("\nUnlocking device...");

    exec('adb shell input keyevent 82', function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error) {
            console.log('Error:' + error.toString());
            return;
        }
    });

    console.log("\nRunning game on device...\n");

    exec('adb shell monkey -p ' + info.bundleId + ' -c android.intent.category.LAUNCHER 1', function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error) {
            console.log('Error:' + error.toString());
            return;
        }
    });
};
/**
 * Deletes all the provided plugins and runs 'prepare-cordova' at the end
 * @param  {Array} plugins - Array of plugin names (strings)
 */
var removePlugins = function (plugins, callback) {
    plugins = Array.isArray(plugins) ? plugins : [plugins];

    var remove = function (plugin) {
        if (plugins.length > 0) {
            execCordova(['plugin', 'rm', plugins.pop()], remove);
        } else {
            callback();
        }
    };

    remove();
};
/**
 * prepare-cordova
 * Updates www folder and config.xml before running `cordova prepare`
 */
var prepareCordova = function (callback) {
    // cordova prepare
    console.log('Running cordova prepare...');
    execCordova(['prepare'], callback);
};

prepareCordova.description = "Call cordova prepare";
gulp.task('prepare-cordova', gulp.series('build', prepareCordova));
gulp.task('prepare-cordova-skip-build', function (callback) {
    prepareCordova(callback);
});

/*
 * deploy-android
 * Generates signed and zipaligned apk
 * Note: does not perform a build task (anymore)
 */
var ask = function (question, askCallback) {
    var readline = require('readline');
    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.question(question, function (answer) {
        rl.close();
        if (askCallback) {
            askCallback(answer);
        }
    });
};
var deployAndroid = function (callback, signOnly) {
    var info = getXmlInfo();
    // var arg3 = process.argv[3];
    // note: the path or filename may change depending on android studio sdk version
    var apk = path.join('platforms', 'android', 'build', 'outputs', 'apk', 'release', 'android-release-unsigned.apk');
    var signed = path.join('platforms', 'android', 'build', 'outputs', 'apk', 'release', 'signed.apk');
    var usedDebugKey = false;
    var addBuildFlavor = function () {
        var buildExtrasPath = path.join('platforms', 'android', 'build-extras.gradle');
        var contents =
            'android {\n' +
            '    flavorDimensions "default"\n' +
            '}';
        if (!fs.existsSync(buildExtrasPath)) {
            fs.writeFileSync(buildExtrasPath, contents);
        }
    };
    var signWithDebug = function () {
        var debugKeyLocation = isWindows ? '%HOMEPATH%\\.android\\debug.keystore' : '~/.android/debug.keystore';
        // sign
        // duplicate apk
        copyFileSync(apk, signed);
        //jarsigner -verbose -keystore luckykat.keystore -storepass [pass] -keypass [pass] input.apk heigames
        // note: timestamp warning for jdk 1.7
        console.log('Signing...');
        exec('jarsigner -verbose -digestalg SHA1 -sigalg MD5withRSA -tsa http://timestamp.digicert.com -keystore ' + debugKeyLocation + ' -storepass android -keypass android ' + signed + ' androiddebugkey', {
            maxBuffer: 1024 * 500
        }, function (error, stdout, stderr) {
            // don't log this stdout as it's just a giant list of all the files in the APK
            // console.log(stdout);
            if (error) {
                console.error(error);
                return;
            }
            zipalign();
        });
    };
    var signOther = function () {
        // var keystore = path.join(isWindows ? '..' : '.', 'scripts', 'luckykat.keystore');
        ask("Path to keystore (enter debug for debug keystore): ", function (keyStorePath) {
            var keystore = keyStorePath;
            if (keystore === 'debug') {
                usedDebugKey = true;
                signWithDebug();
                return;
            }
            ask("Keystore password: ", function (pass) {
                // sign
                // duplicate apk
                copyFileSync(apk, signed);
                // note: timestamp warning for jdk 1.7
                console.log('Signing...');
                exec('jarsigner -verbose -digestalg SHA1 -sigalg MD5withRSA -tsa http://timestamp.digicert.com -keystore ' + keystore + (pass ? ' -storepass ' + pass + ' -keypass ' + pass + " " : "") + signed + ' heigames', {
                    maxBuffer: 1024 * 500
                }, function (error, stdout, stderr) {
                    // don't log this stdout as it's just a giant list of all the files in the APK
                    // console.log(stdout);
                    if (error) {
                        console.error(error);
                        return;
                    }
                    zipalign();
                });
            });
        });
    };
    var zipalign = function () {
        var zipAlignPath = path.join('.', 'scripts', 'cordova', 'zipalign');
        var output = path.join(
            'build',
            info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + (usedDebugKey ? '-debug' : '') + '.apk'
        );

        // make sure build folder exists
        if (!fs.existsSync(path.join('build'))) {
            fs.mkdirSync(path.join('build'));
        }
        // zipalign
        //./zipalign -v 4 input.apk input_aligned.apk
        console.log('Zipalign...');
        // execCommand(zipAlignPath + isWindows ? '.exe' : '', ['-f', /*'-v',*/ '4', signed, output]);
        if (isWindows) {
            zipAlignPath = path.join('.', 'scripts', 'cordova', 'zipalign-win', 'zipalign.exe');
            exec(zipAlignPath + ' -f 4 ' + signed + ' ' + output, function (error, stdout, stderr) {
                console.log(stdout);
                if (error) {
                    console.log('ERROR could not zipalign.');
                    console.log(stderr);
                    return;
                }
                console.log('Finished.');
                callback();
            });
        } else {
            execCommand(zipAlignPath, ['-f', /*'-v',*/ '4', signed, output], callback);
        }
        console.log('Build saved to ' + output);
    };
    var build = function () {
        console.log('Build android...');
        execCordova(['build', '--release', 'android'], signOther);
    };
    var run = function () {
        addBuildFlavor();

        if (signOnly) {
            signOther();
            return;
        }

        // the build automatically does prepare (?)
        build();
    };

    run();
};
gulp.task('deploy-android', function (callback) {
    deployAndroid(callback, false);
});
/*
 * (Re-)sign the unsigned apk 
 */
gulp.task('sign-android', function (callback) {
    deployAndroid(callback, true);
});
/**
 * deploy-ios
 * Generates ipa, place a build.json in the project root to specify what provisioning file to use
 * Note: It may be better to simply open the xcode project and compile from xcode.
 */
gulp.task('deploy-ios', function (callback) {
    var info = getXmlInfo();
    var ipa = path.join('platforms', 'ios', 'build', 'device', info.name + '.ipa');
    var buildJson = false;
    var getBuildJson = function () {
        if (!fs.existsSync(path.join('build.json'))) {
            console.log('build.json does not exist.');
            return;
        }
        console.log('Found build.json');
        buildJson = true;
    };
    var build = function () {
        var args = ['build', '--release', '--device', 'ios'];

        getBuildJson();

        if (buildJson) {
            args.push('--buildConfig');
            args.push(path.join('build.json'));
        }

        console.log('Build iOS...');
        execCordova(args, check);
    };
    var check = function () {
        var output = path.join('build', info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + '.ipa');
        // check if ipa was built
        if (!fs.existsSync(ipa)) {
            console.error('Could not find ipa');
            return;
        }

        // make sure build folder exists
        if (!fs.existsSync(path.join('build'))) {
            fs.mkdirSync(path.join('build'));
        }
        console.log('Copy ipa into build folder');

        // copy ipa into the build folder
        copyFileSync(ipa, path.join('build'));
        fs.renameSync(
            path.join('build', info.name + '.ipa'),
            output
        );
        console.log('Build saved to ' + output);
    };

    // cordova prepare
    console.log('Running cordova prepare...');
    execCordova(['prepare'], build);
});
/**
 * Installs and runs latest apk to android
 */
gulp.task('install-android', function (done) {
    var info = getXmlInfo();
    var fileName = info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + '.apk';
    var filePath = path.join('build', fileName);

    if (!fs.existsSync(filePath)) {
        // try again with debug
        var fileDebug = info.name.replace(/\s+/g, '') + 'V' + info.version + '-' + info.build + '-debug.apk';
        filePath = path.join('build', fileDebug);
        if (!fs.existsSync(filePath)) {
            console.error("Could not find apk " + fileName);
            return;
        }
    }
    installAndroid(function () {
        runAndroid();
        done();
    });
});
/**
 * Run latest apk to android
 */
gulp.task('run-android', function (done) {
    runAndroid();
    done();
});
/**
 * Copy a test build to cordova projects
 */
gulp.task('copy-www-cordova', function (callback) {

    // copy www to ios/www
    copyBuildToIosWww();

    // copy www to android/assets/www
    copyBuildToAndroidWww();

    callback();
});
/**
 * Watch files and copy test builds to cordova
 */
gulp.task('reinstall-plugins', function (callback) {
    var inquirer = require('inquirer');
    var plugins = [];
    var choices = [];
    var allStr = 'All plugins';

    var getDirectories = function (srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    };

    plugins = getDirectories(path.join('plugins'));

    // format for inquirer checkbox
    choices = (function () {
        var ii = 0;
        var iil = 0;
        var arr = [{
            name: allStr
        }];

        for (ii = 0, iil = plugins.length; ii < iil; ++ii) {
            arr.push({
                name: plugins[ii]
            });
        }

        return arr;
    });

    inquirer.prompt([{
        type: 'checkbox',
        message: 'Which plugins to reinstall (press space to select)',
        name: 'plugins',
        choices: choices,
        validate: function (answer) {
            if (answer.length < 1) {
                return 'You must choose at least one plugin';
            }
            return true;
        }
    }]).then(function (answers) {
        if (answers.plugins.indexOf(allStr) > -1) {
            removePlugins(plugins, callback);
        } else {
            removePlugins(answers.plugins, callback);
        }
    });
});

/**
 * Delete an entire folder
 * http://stackoverflow.com/a/32197381/5930772
 */
var deleteFolderRecursive = function (source) {
    if (fs.existsSync(source)) {
        fs.readdirSync(source).forEach(function (file, index) {
            var curPath = path.join(source, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(source);
    }
};

/**
 * Clean cordova structure
 */
function cleanCordova(done) {
    ask("Are you sure you want to clean? This will remove /plugins and /platforms and remove cordova/dependency entries from package.json (y/n) ", function (answer) {
        var plugins = path.join('.', 'plugins');
        var platforms = path.join('.', 'platforms');
        var packageJsonStr;
        var packageJson;
        if (answer.toLowerCase() === 'y') {
            if (fs.existsSync(plugins)) {
                deleteFolderRecursive(plugins);
            }
            if (fs.existsSync(platforms)) {
                deleteFolderRecursive(platforms);
            }
            if (fs.existsSync('package.json')) {
                packageJsonStr = fs.readFileSync(path.join('package.json'), 'utf-8');
                packageJson = JSON.parse(packageJsonStr);
                delete packageJson.dependencies;
                delete packageJson.cordova;
                fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4));
            }
            done();
        } else {
            console.log('cancelled');
            done();
        }
    });
}
gulp.task('clean-cordova', cleanCordova);