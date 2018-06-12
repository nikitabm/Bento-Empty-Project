// fix for EMFILE error, having too many files opened
var realFs = require('fs');
var gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

var gulp = require('gulp');
var foreach = require('gulp-foreach');
var tap = require('gulp-tap');
var replace = require('gulp-replace');
var plumber = require('gulp-plumber');
var path = require('path');
var exec = require('child_process').exec;
var os = require('os');
var jsonFiles = {};
var jsons = {};
var spriteJsons = {};
var onError = function (err) {
    console.log(err);
    this.emit('end');
};
var stream = require('stream');
var File = require('vinyl');
var toFile = function (file) {
    var src = new stream.Readable({
        objectMode: true
    });
    src._read = function () {
        this.push(new File(file));
        this.push(null);
    };
    return src;
};

// some utils
var Utils = {};
Utils.isArray = Array.prototype.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
};
Utils.getKeyLength = function (obj) {
    return Object.keys(obj).length;
};
Utils.forEach = function (array, callback) {
    var obj;
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

// async completion
var Completion = function (onComplete) {
    var todo = 0;
    var done = 0;

    return {
        add: function () {
            todo += 1;
        },
        done: function () {
            done += 1;
            if (todo === done) {
                onComplete();
            }
        }
    };
};
// http://stackoverflow.com/a/32197381/5930772
var deleteFolderRecursive = function (source) {
    var fs = realFs;
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

// define custom tasks
require('./scripts/customtasks');


var audioFormats = [
    'assets/**/*.ogg',
    'assets/**/*.mp3',
    'assets/**/*.ac3'
];

// build tasks
gulp.task('build-web', [
    'collect-assets',
    'clean',
    'copy',
    'concat',
    // 'copysprites'
    // 'sprite'
    'packAssets',
], function () {
    // place code for your default task here
    var uglify = require('gulp-uglify');
    var usemin = require('gulp-usemin');

    return gulp.src(['build/index.html'], {
            base: './build'
        })
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(usemin({
            js: [uglify()]
        }))
        .pipe(gulp.dest('./build/'));
});
gulp.task('build-cocoonjs', [
    'ogg-only',
    'collect-assets',
    'clean',
    'copy',
    'copyJs',
    'replace',
    'replaceDev',
    'uglify',
    'cordovaReplace',
    'packAssets',
    // 'copysprites',
    /*'sprite',*/
    'restore-audio',
    'collect-assets'
], function () {
    var zip = require('gulp-zip');

    return gulp.src(['build/**/*.*'], {
            base: './build'
        })
        .pipe(zip('build.zip'))
        .pipe(gulp.dest('./build'));
});
gulp.task('build-cocoontest', [
    'ogg-only',
    'collect-assets',
    'clean',
    'copy',
    'copyJs',
    'replace',
    'cordovaReplace',
    'packAssets',
    // 'copysprites',
    'restore-audio',
    'collect-assets'
], function () {
    var zip = require('gulp-zip');
    return gulp.src(['build/**/*.*'], {
            base: './build'
        })
        .pipe(zip('build.zip'))
        .pipe(gulp.dest('./build'));

});
gulp.task('watch', ['build-cocoontest'], function () {
    gulp.watch([
        'js/**/*.js',
        'assets/**/*',
        '!assets/*.json',
        'index.html',
        'lib/**/*.js'
    ], {
        interval: 1000
    }, ['build-cocoontest']);
});

// collect assets
gulp.task('collectLoop', [], function () {
    var isWin = (os.platform() === 'win32'),
        slash = isWin ? '\\' : '/',
        cwd = __dirname + slash;
    var src = [
        'assets/**/*.json',
        'assets/**/*.png',
        'assets/**/*.ttf',
        '!assets/**/*.tmp',
        '!assets/**/*.json.*',
        '!assets/*.json',
        '!assets/**/*.tmx',
        '!assets/**/*.tsx'
    ].concat(audioFormats);
    var i;

    // reset jsons
    jsons = {};

    return gulp.src(src)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(tap(function (file, t) {
            var filePath = file.path.replace(cwd + 'assets' + slash, '');
            var folders = filePath.split(slash);
            var baseName = folders[0];
            var assetName;
            var asset;
            var collectSimple = function (type) {
                asset = filePath.replace(baseName + slash + type + slash, '');
                assetName = asset.split('.')[0];

                if (isWin) {
                    asset = asset.replace(/\\/g, '/');
                    assetName = assetName.replace(/\\/g, '/');
                }

                json[type] = json[type] || {};
                json[type][assetName] = asset;

                // exception: spritesheets dont need filetype
                if (type === 'spritesheets') {
                    json[type][assetName] = json[type][assetName].replace('.json', '');
                    json[type][assetName] = json[type][assetName].replace('.png', '');
                }
            };
            var collectAudio = function () {
                var type = 'audio';
                asset = filePath.replace(baseName + slash + type + slash, '');
                assetName = asset.split('.')[0];

                if (isWin) {
                    asset = asset.replace(/\\/g, '/');
                    assetName = assetName.replace(/\\/g, '/');
                }

                json[type] = json[type] || {};
                json[type][assetName] = json[type][assetName] || [];
                json[type][assetName].push(asset);
            };
            // add key
            var json = jsons[baseName];
            if (!json) {
                jsons[baseName] = {};
                json = jsons[baseName];
            }

            // path does not include '.': it's not a file
            if (filePath.indexOf('.') === -1) {
                return;
            }

            // type
            if (folders[1] === 'images') {
                collectSimple('images');
            } else if (folders[1] === 'json') {
                collectSimple('json');
            } else if (folders[1] === 'audio') {
                collectAudio();
            } else if (folders[1] === 'fonts') {
                collectSimple('fonts');
            } else if (folders[1] === 'spritesheets') {
                collectSimple('spritesheets');
            } else {
                // binary?
            }

            // fileName = path.basename(file.path);

        }));
});
gulp.task('collect-assets', ['collectLoop'], function () {
    // write out json files
    var isWin = (os.platform() === 'win32'),
        slash = isWin ? '\\' : '/';
    var json;
    var jsonfile = require('jsonfile');
    var jeditor = require("gulp-json-editor");
    var stringify = require('json-stable-stringify');


    jsons = JSON.parse(stringify(jsons));

    jsonfile.spaces = 4;

    return toFile({
            path: 'fake.json',
            contents: new Buffer(JSON.stringify(jsons))
        })
        .pipe(jeditor(function (file) {
            for (json in jsons) {
                if (jsons.hasOwnProperty(json)) {
                    // add path
                    jsons[json].path = 'assets/' + json + '/';
                    // write file
                    // jsonfile.writeFileSync('assets/' + json + '.json', jsons[json]);
                }
            }
            jsonfile.writeFileSync('assets.json', jsons);

            return file;
        }));
});
gulp.task('collector', ['collect-assets'], function () {
    var watch = require('gulp-watch');
    watch([
        'assets/**/*',
        '!assets/**/*.tmp',
        '!assets/*.json',
        '!assets/**/*.json.*',
        '!assets/**/*.tmx'
    ], ['add', 'unlink'], function () {
        gulp.start('collect-assets');
    });
});

// build steps
gulp.task('clean', ['collect-assets'], function () {
    var clean = require('gulp-clean');
    return gulp.src('build', {
            read: false
        }).pipe(plumber({
            errorHandler: onError
        }))
        .pipe(clean({
            force: true
        }));
});
gulp.task('copy', ['clean'], function () {
    // copies all assets, except images
    var src = [
        'assets/**/*.json',
        'assets/**/*.png',
        'assets/**/*.ttf',
        // '!./assets/**/images/**/*', // ignore images for texture packer
        './res/**/*',
        './lib/**/*',
        './index.html',
        './crosspromo/**/*',
        './assets.json',
        './style.css',
        './package.json',
        './google-services.json',
        './GoogleService-Info.plist'
    ].concat(audioFormats);

    return gulp.src(src, {
            base: './'
        })
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('./build'));
});
gulp.task('ogg-only', [], function () {
    // for cocoon builds, ogg is enough
    audioFormats = ['assets/**/*.ogg'];
});
gulp.task('restore-audio', ['copy'], function () {
    // restore all audio formats after copying the files
    audioFormats = [
        'assets/**/*.ogg',
        'assets/**/*.mp3',
        'assets/**/*.ac3'
    ];
    gulp.start('collect-assets');
});

gulp.task('copysprites', ['clean', 'copy'], function () {
    // copy images instead of creating texture packages
    return gulp.src([
            './assets/**/images/**/*'
        ], {
            base: './'
        })
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('./build'));
});
gulp.task('concat', ['copy'], function () {
    // concats all js files into game.js
    var concat = require('gulp-concat');
    return gulp.src([
            'js/**/*.js'
        ])
        // output
        .pipe(concat('game.js'))
        .pipe(gulp.dest('build/js'));
});
gulp.task('copyJs', ['clean', 'copy'], function () {
    // copy without concatting
    return gulp.src([
            'js/**/*.js'
        ])
        .pipe(gulp.dest('build/js'));
});
gulp.task('cordovaReplace', ['clean', 'copy'], function () {
    // insert cordova.js
    return gulp.src([
            './build/index.html'
        ], {
            base: './'
        })
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(replace('<!-- replace:cordova -->', '<script src="cordova.js"></script>'))
        .pipe(gulp.dest('./'));
});
gulp.task('replace', ['copyJs'], function () {
    var xmlInfo = getXmlInfo();
    // replace specific strings
    return gulp.src([
            './build/js/**/*.js'
        ], {
            base: './'
        })
        .pipe(replace('DEV_MODE: true', 'DEV_MODE: false'))
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+?)\/\* remove\:end \*\//g, ''))
        .pipe(replace('/*replace:version*/', 'window.VERSION = "' + xmlInfo.version + '";'))
        .pipe(replace('/*replace:build*/', 'window.BUILD = ' + xmlInfo.build + ';')) // this is android build number
        .pipe(gulp.dest('./'));
});
gulp.task('replaceDev', ['replace'], function () {
    // replace specific strings
    return gulp.src([
            './build/js/game.js',
            './build/js/utils.js'
        ], {
            base: './'
        })
        .pipe(replace('BETA_TEST: true', 'BETA_TEST: false'))
        .pipe(replace('DGG_DEMO: true', 'DGG_DEMO: false'))
        .pipe(replace('dev: true', 'dev: false'))
        .pipe(gulp.dest('./'));
});

gulp.task('uglify', ['replace', 'replaceDev'], function () {
    var uglify = require('gulp-uglify');
    return gulp.src([
            './build/js/**/*.js'
        ], {
            base: './'
        })
        .pipe(uglify())
        .pipe(gulp.dest('./'));
});
gulp.task('getJSON', ['copy'], function () {
    // This task reads the assets json file and prepares it for texturepacker settings
    var jeditor = require("gulp-json-editor");
    var currentFile;

    // TODO: make compatible with assets.json
    // for now we grab the global jsons variable that was calculated by collect-assets
    spriteJsons = JSON.parse(JSON.stringify(jsons));

    // return gulp.src('assets/*.json')
    return toFile({
            path: 'assets.json',
            contents: new Buffer(JSON.stringify(spriteJsons))
        })
        // .pipe(tap(function (file) {
        //     currentFile = path.basename(file.path);
        //     jsonFiles[currentFile] = {};
        //     jsonFiles[currentFile].images = [];
        //     //console.log(currentFile);
        // }))
        .pipe(jeditor(function (file) {
            var i, image, name;
            var images = [];
            var group;

            // go through all asset groups and init .images and .texturePacker
            for (currentFile in spriteJsons) {
                group = spriteJsons[currentFile];
                jsonFiles[currentFile] = {};
                jsonFiles[currentFile].images = [];

                if (!group.images) {
                    // this asset group has no images
                    continue;
                }

                for (image in group.images) {
                    jsonFiles[currentFile].images.push(group.path + 'images/' + group.images[image]);
                    // console.log(group.path + 'images/' + group.images[image]);
                }
                // edit it while we're at it
                name = currentFile;
                group.images = {};
                group.images[name] = name + '.png';
                group.texturePacker = {};
                group.texturePacker[name] = currentFile + '.json';

            }
            return spriteJsons; // must return JSON object.
        }))
        .pipe(gulp.dest('./build/'));
});
/**
 * Pack assets according to the settings of each asset group
 */
gulp.task('packAssets', ['copy'], function (onComplete) {
    // open assets.json
    var fs = realFs;
    var Jimp = require("jimp");
    var imageSize = require('fast-image-size');
    var MaxRectsPacker = require("maxrects-packer");
    var buildPath = 'build';
    var assetsJson = fs.readFileSync(path.join(buildPath, 'assets.json'), 'utf8');
    var spriteSheetJsons = {};
    // prepare for async tasks
    var tasks = new Completion(function () {
        cleanUp();
        onComplete();
    });
    // cleanup: delete the folders of assets that were packed
    var toDelete = [];
    var cleanUp = function () {
        // TODO clean up assets and clean up assets.json
        Utils.forEach(toDelete, function (deletionData) {
            var assetGroupName = deletionData.assetGroupName;
            var type = deletionData.type;

            delete assetsJson[assetGroupName][type];
            deleteFolderRecursive(path.join(buildPath, 'assets', assetGroupName, type));
        });
        // write new asstes json 
        fs.writeFileSync(path.join(buildPath, 'assets.json'), JSON.stringify(assetsJson));
    };
    // pack the images folder
    var packImages = function (assetGroup, assetGroupName, type) {
        var basePath = assetGroup.path;
        var images = assetGroup[type];

        var packer = new MaxRectsPacker(2048, 2048, 1, {
            smart: true,
            pot: false,
            square: false
        });
        var input = [];
        var jimpImages = {};

        var compositePack = function () {
            Utils.forEach(packer.bins, function (bin, i) {
                // new image for each bin
                tasks.add();
                var img = new Jimp(bin.width, bin.height, function (err, image) {
                    Utils.forEach(bin.rects, function (rect) {
                        // paste the image according to the rect
                        var x = rect.x;
                        var y = rect.y;
                        var width = rect.width;
                        var height = rect.height;
                        var data = rect.data;
                        var subImage = jimpImages[data.imagePath];
                        image.blit(subImage, x, y);

                        // replace data part
                        delete rect.data;
                        rect.assetName = data.assetName;

                        if (type === 'spritesheets') {
                            rect.spriteSheet = data.spriteSheet;
                        }
                    });
                    var outputDir = path.join(buildPath, 'assets', assetGroupName, 'packed-' + type);
                    var outputJson = bin.rects;
                    image.write(path.join(outputDir, assetGroupName + '-' + i + '.png'), function () {
                        // write the json data
                        fs.writeFileSync(path.join(outputDir, assetGroupName + '-' + i + '.json'), JSON.stringify(outputJson));

                        // add asset to assets.json
                        assetsJson[assetGroupName]['packed-' + type] = assetsJson[assetGroupName]['packed-' + type] || {};
                        assetsJson[assetGroupName]['packed-' + type][assetGroupName + '-' + i] = assetGroupName + '-' + i;

                        tasks.done();
                    });
                });
            });
        };

        if (!images) {
            return;
        }
        // loop through images
        Utils.forEach(images, function (imagePath, assetName) {
            var imageUrl = path.join(buildPath, basePath, type, imagePath);

            // should end with .png
            if (imageUrl.indexOf('.png') < 0) {
                imageUrl += '.png';
            }

            // inspect the size of the image first
            var sizeData = imageSize(imageUrl);
            var inputData = {
                imagePath: sizeData.image, // used to identify the jimp image
                assetName: assetName // used for the rects output json
            };
            // add the rectangle
            input.push({
                width: sizeData.width,
                height: sizeData.height,
                data: inputData
            });
            // add spritesheet data
            if (type === 'spritesheets') {
                inputData.spriteSheet = spriteSheetJsons[assetName];
            }
            // load the image with jimp
            tasks.add();
            Jimp.read(imageUrl, function (err, image) {
                if (err) {
                    throw err;
                }
                // save the 
                jimpImages[imageUrl] = image;

                // async loaded all images
                if (Utils.getKeyLength(jimpImages) === Utils.getKeyLength(images)) {
                    compositePack();
                }
                tasks.done();
            });
        });
        packer.addArray(input);
        toDelete.push({
            assetGroupName: assetGroupName,
            type: type
        });
    };
    var packJson = function (assetGroup, assetGroupName) {
        var basePath = assetGroup.path;
        var assetJsons = assetGroup.json;
        var outputJson = {};

        if (!assetJsons) {
            return;
        }

        // loop through json files
        Utils.forEach(assetJsons, function (jsonPath, assetName) {
            // load that json
            var json = fs.readFileSync(path.join(buildPath, 'assets', assetGroupName, 'json', jsonPath), 'utf8');
            outputJson[assetName] = JSON.parse(json);
        });
        // write
        var dir = path.join(buildPath, 'assets', assetGroupName, 'packed-json');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(path.join(dir, assetGroupName + '.json'), JSON.stringify(outputJson));

        // add to assets.json
        var group = {};
        group[assetGroupName] = assetGroupName + '.json';
        assetsJson[assetGroupName]['packed-json'] = group;

        // delete old json files
        toDelete.push({
            assetGroupName: assetGroupName,
            type: 'json'
        });
    };
    var packSpriteSheetFull = function (assetGroup, assetGroupName) {
        var basePath = assetGroup.path;
        var spritesheets = assetGroup.spritesheets;

        if (!spritesheets) {
            return;
        }
        // collect spritesheet json
        Utils.forEach(spritesheets, function (assetPath, assetName) {
            // load that json
            var json = fs.readFileSync(path.join(buildPath, 'assets', assetGroupName, 'spritesheets', assetPath + '.json'), 'utf8');
            if (spriteSheetJsons[assetName]) {
                console.log("WARNING: asset name used twice: " + assetName);
            }
            spriteSheetJsons[assetName] = JSON.parse(json);
        });
        packImages(assetGroup, assetGroupName, 'spritesheets');
    };
    var packSpriteSheetFolder = function (assetGroup, assetGroupName) {
        // TODO
        /*var basePath = assetGroup.path;
        var spriteSheets = assetGroup.spritesheets;
        var folders = {};

        if (!spriteSheets) {
            return;
        }
        // collect the folders first
        Utils.forEach(spriteSheets, function (spriteSheetPath, spriteSheetName) {
            var tokens = spriteSheetName.split('/');
            if (tokens.length === 1) {
                // root
                folders['.'] = folders['.'] || {};
                folders['.'][spriteSheetPath] = spriteSheetName;
            } else {
                folders[tokens[0]] = folders[tokens[0]] || {};
                folders[tokens[0]][spriteSheetPath] = spriteSheetName;
            }
        });

        // loop through folders and create packs
        Utils.forEach(folders, function (folder, folderName) {
            
        });*/
    };

    // parse json after reading
    assetsJson = JSON.parse(assetsJson);

    Utils.forEach(assetsJson, function (assetGroup, assetGroupName) {
        tasks.add();
        // read settings.json
        var settingsJson = fs.readFileSync(path.join(buildPath, 'assets', assetGroupName, 'settings.json'), 'utf8');
        settingsJson = JSON.parse(settingsJson);

        if (settingsJson.packImages) {
            packImages(assetGroup, assetGroupName, 'images');
        }
        if (settingsJson.packJson) {
            packJson(assetGroup, assetGroupName);
        }
        if (settingsJson.packSpriteSheets === 'full') {
            packSpriteSheetFull(assetGroup, assetGroupName);
        }
    });

    Utils.forEach(assetsJson, function (assetGroup, assetGroupName) {
        tasks.done();
    });
});

gulp.task('compressJson', [], function () {});

gulp.task('check', function () {
    var jshint = require('gulp-jshint');
    // place code for your default task here
    return gulp.src(['js/**/*.js', '!js/lib/*.js'])
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(jshint({
            newcap: false
        }))
        .pipe(jshint.reporter());
});

/**
 * Extracts name and versions
 */
var getXmlInfo = function () {
    // note: parsing might be better with the etree node module
    var xml;
    var info = {};
    var start, end, length;
    var fs = require('fs');
    // read config.xml from root folder
    xml = fs.readFileSync(path.join('config.xml'), 'utf-8');

    // parse name
    if (xml) {
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
    }

    return info;
};

/**
 * Code for subsetting fonts from here on.
 * Only embed the characters that are needed for in-game text. For non-alphabet languages.
 *
 * IMPORTANT: To only get ttf files as output, go into gulp-fontmin/index.js and comment out
 * the 4 '.use(Fontmin...' after '.use(Fontmin.glyph(opts))'
 *
 * A pull request has fixed the bug, but isn't merged yet: https://github.com/ecomfe/gulp-fontmin/pull/8
 */
// Make sure to also load in all alphanumeric characters, puncutation, and currency symbols
var charsZH = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/';
var charsZT = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/';
var charsJA = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/';
var charsKO = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/';

gulp.task('getCharactersZT', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/zt.json')
        .pipe(jeditor(function (json) {
            charsZT += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

gulp.task('subsetZT', ['getCharactersZT'], function () {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    return gulp.src('misc/original-fonts/chintrad.ttf')
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsZT
            })]
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersZH', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/zh.json')
        .pipe(jeditor(function (json) {
            charsZH += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

gulp.task('subsetZH', ['getCharactersZH'], function () {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    return gulp.src('misc/original-fonts/chinese.ttf')
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsZH
            })]
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersJA', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/ja.json')
        .pipe(jeditor(function (json) {
            charsJA += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

gulp.task('subsetJA', ['getCharactersJA'], function () {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    return gulp.src('misc/original-fonts/japanese.ttf')
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsJA
            })]
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersKO', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/ko.json')
        .pipe(jeditor(function (json) {
            charsKO += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

gulp.task('subsetKO', ['getCharactersKO'], function () {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    return gulp.src('misc/original-fonts/bmhanna.ttf')
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsKO
            })]
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('subset', function () {
    gulp.run('subsetZT');
    gulp.run('subsetZH');
    gulp.run('subsetJA');
    gulp.run('subsetKO');
});

gulp.task('build-desktop', ['ogg-only', 'build-web', 'restore-audio'], function (callback) {
    var NwBuilder = require('nw-builder');
    var nw = new NwBuilder({
        files: './build/**/**', // use the glob format
        platforms: ['osx64' /*, 'win32', 'win64'*/ ],
        buildDir: './app',
        macIcns: 'misc/icon.icns',
        version: '0.19.2',
        flavor: 'normal'
    });
    nw.build().then(function () {

        callback();
    }).catch(function (error) {
        console.error(error);
        callback();
    });
});

gulp.task('run', function (callback) {
    exec('nw ./', {}, function (error, stdout, stderr) {});
});