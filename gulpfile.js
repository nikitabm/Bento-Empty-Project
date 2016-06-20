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
    'copysprites'
    // 'sprite'
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
    'copysprites',
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
    'copysprites',
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
    ], ['build-cocoontest']);
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
    var foreach = require('gulp-foreach');
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

function texturePackerTemplate(params) {
    var isWin = (os.platform() === 'win32'),
        slash = isWin ? '\\' : '/',
        items = params.items,
        itemObj = {
            frames: []
        },
        frames = itemObj.frames,
        item;

    if (items.length > 0) {
        item = items[0];
        itemObj.meta = {
            app: "https://github.com/Ensighten/spritesmith",
            image: item.image,
            format: 'RGBA8888',
            size: {
                w: item.total_width,
                h: item.total_height
            },
            scale: 1
        };
    }

    items.forEach(function (item) {
        var cwd = __dirname + slash;
        var imagePath = item.source_image.replace(cwd + 'assets' + slash, '');

        imagePath = imagePath.slice(imagePath.lastIndexOf('images' + slash) + ('images' + slash).length);

        if (isWin) {
            imagePath = imagePath.replace(/\\/g, '/');
        }

        frames.push({
            frame: {
                x: item.x,
                y: item.y,
                w: item.width,
                h: item.height
            },
            // filename: everything after the image/ folder
            filename: imagePath
            // filename: path.basename(item.source_image)
        });
    });

    return JSON.stringify(itemObj, null, 4);
}

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
        '!./assets/**/images/**/*', // ignore images for texture packer
        './res/**/*',
        './lib/**/*',
        './index.html',
        './crosspromo/**/*',
        './assets.json',
        './style.css'
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
    // replace specific strings
    return gulp.src([
            './build/js/**/*.js'
        ], {
            base: './'
        })
        .pipe(replace('DEV_MODE: true', 'DEV_MODE: false'))
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+)\/\* remove\:end \*\//g, ''))
        .pipe(gulp.dest('./'));
});
gulp.task('replaceDev', ['replace'], function () {
    // replace specific strings
    return gulp.src([
            './build/js/**/*.js'
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
    // TODO: make compatible with assets.json
    var jeditor = require("gulp-json-editor");
    var currentFile;
    // return gulp.src('assets/*.json')
    return toFile({
            path: 'assets.json',
            contents: new Buffer(JSON.stringify(jsons))
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
            var json;

            for (currentFile in jsons) {
                json = jsons[currentFile];
                if (!json.images) {
                    continue;
                }
                jsonFiles[currentFile] = {};
                jsonFiles[currentFile].images = [];

                for (image in json.images) {
                    jsonFiles[currentFile].images.push(json.path + 'images/' + json.images[image]);
                    // console.log(json.path + 'images/' + json.images[image]);
                }
                // edit it while we're at it
                name = currentFile;
                json.images = {};
                json.images[name] = name + '.png';
                json.texturePacker = {};
                json.texturePacker[name] = currentFile + '.json';

            }
            return jsons; // must return JSON object.
        }))
        .pipe(gulp.dest('./build/'));
});
gulp.task('sprite', ['getJSON'], function () {
    var jeditor = require("gulp-json-editor");
    var spritesmith = require('gulp.spritesmith');
    var mergeStreams = require('merge-stream')();
    var json, name;
    var addStream = function (jsonIn) {
        var i;
        var images = [];
        var jsonName;
        var stream = toFile({
                path: 'fake.json',
                contents: new Buffer(JSON.stringify(jsonIn))
            })
            .pipe(jeditor(function (file) {
                jsonName = path.basename(file.path);
                return gulp.src(jsonFiles[jsonName].images)
                    .pipe(plumber({
                        errorHandler: onError
                    }))
                    // .pipe(tap(function (file, t) {
                    //     console.log(path.basename(file.path));
                    // }))
                    .pipe(spritesmith({
                        imgName: jsonName + '/images/' + jsonName + ".png",
                        cssName: jsonName + '/json/' + jsonName + ".json",
                        algorithm: 'binary-tree',
                        padding: 2,
                        cssTemplate: texturePackerTemplate // <-- this right here
                    }))
                    .pipe(gulp.dest('./build/assets/'));
            }));

        mergeStreams.add(stream);
    };

    for (name in jsons) {
        json = jsons[name];
        addStream(json);
    }

    return mergeStreams;
});

// audio
var jsonAudio = {
    audio: {}
};
gulp.task('convertAudio', [], function () {
    jsonAudio = {
        audio: {}
    };
    return gulp.src('misc/mp3/*.mp3')
        .pipe(tap(function (file) {
            var command = '',
                currentFile = path.basename(file.path, '.mp3');

            jsonAudio.audio[currentFile] = jsonAudio.audio[currentFile] || [];

            command = 'ffmpeg -i ';
            command += 'misc/mp3/' + currentFile + '.mp3 -ab 128k -y misc/mp3/output/' + currentFile + '.mp3';
            exec(command, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
            });
            jsonAudio.audio[currentFile].push(currentFile + '.mp3');

            //console.log(currentFile);
            command = 'ffmpeg -i ';
            command += 'misc/mp3/' + currentFile + '.mp3 -acodec libvorbis -ab 128k -y misc/mp3/output/' + currentFile + '.ogg';
            exec(command, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
            });
            jsonAudio.audio[currentFile].push(currentFile + '.ogg');

            command = 'ffmpeg -i ';
            command += 'misc/mp3/' + currentFile + '.mp3 -acodec ac3 -ab 128k -y misc/mp3/output/' + currentFile + '.ac3';
            exec(command, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
            });
            jsonAudio.audio[currentFile].push(currentFile + '.ac3');
        }));
});
gulp.task('wav2mp3', [], function () {
    jsonAudio = {
        audio: {}
    };
    return gulp.src('misc/wav/*.wav')
        .pipe(tap(function (file) {
            var command = '',
                currentFile = path.basename(file.path, '.wav'),
                outFile = currentFile.replace('cc_', 'sfx_');

            command = 'ffmpeg -i ';
            command += 'misc/wav/' + currentFile + '.wav -y misc/mp3/' + outFile + '.mp3';
            exec(command, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
            });
        }));
});
gulp.task('ogg2wav', [], function () {
    jsonAudio = {
        audio: {}
    };
    return gulp.src('misc/ogg/*.ogg')
        .pipe(tap(function (file) {
            var command = '',
                currentFile = path.basename(file.path, '.ogg'),
                outFile = currentFile.replace('SC_', 'sfx_');

            command = 'ffmpeg -i ';
            command += 'misc/ogg/' + currentFile + '.ogg -af "volume=15dB" -y misc/wav/' + outFile + '.wav';
            exec(command, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
            });
        }));
});
gulp.task('audio', ['convertAudio'], function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('misc/mp3/output.json')
        .pipe(jeditor(function (jsonFile) {
            jsonFile = jsonAudio;
            return jsonFile; // must return JSON object.
        }))
        .pipe(gulp.dest('./misc/mp3/'));
});

/**
 * Code for subsetting fonts from here on.
 * Only embed the characters that are needed for in-game text. For non-alphabet languages.
 *
 * IMPORTANT: To only get ttf files as output, go into gulp-fontmin/index.js and comment out
 * the 4 '.use(Fontmin...' after '.use(Fontmin.glyph(opts))'
 */
// Make sure to also load in all alphanumeric characters, puncutation, and currency symbols
var charsZH = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/',
    charsZT = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/',
    charsJA = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/',
    charsKO = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM.?!,-=+:$€￥¥元₩£&@®%#*(){}[]/';

gulp.task('getCharactersZT', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/zt.json')
        .pipe(jeditor(function (json) {
            var str;
            for (str in json.strings) {
                charsZT += json.strings[str];
            }
            return json; // must return JSON object.
        }));
});

gulp.task('subsetZT', ['getCharactersZT'], function () {
    var fontmin = require('gulp-fontmin');
    return gulp.src('misc/original-fonts/chintrad.ttf')
        .pipe(fontmin({
            text: charsZT
        }, {
            use: fontmin.glyph // only export .ttf
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersZH', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/zh.json')
        .pipe(jeditor(function (json) {
            var str;
            for (str in json.strings) {
                charsZH += json.strings[str];
            }
            return json; // must return JSON object.
        }));
});

gulp.task('subsetZH', ['getCharactersZH'], function () {
    var fontmin = require('gulp-fontmin');
    return gulp.src('misc/original-fonts/chinese.ttf')
        .pipe(fontmin({
            text: charsZH
        }, {
            use: fontmin.glyph // only export .ttf
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersJA', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/ja.json')
        .pipe(jeditor(function (json) {
            var str;
            for (str in json.strings) {
                charsJA += json.strings[str];
            }
            return json; // must return JSON object.
        }));
});

gulp.task('subsetJA', ['getCharactersJA'], function () {
    var fontmin = require('gulp-fontmin');
    return gulp.src('misc/original-fonts/japanese.ttf')
        .pipe(fontmin({
            text: charsJA
        }, {
            use: fontmin.glyph // only export .ttf
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('getCharactersKO', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/**/ko.json')
        .pipe(jeditor(function (json) {
            var str;
            for (str in json.strings) {
                charsKO += json.strings[str];
            }
            return json; // must return JSON object.
        }));
});

gulp.task('subsetKO', ['getCharactersKO'], function () {
    var fontmin = require('gulp-fontmin');
    return gulp.src('misc/original-fonts/bmhanna.ttf')
        .pipe(fontmin({
            text: charsKO
        }, {
            use: fontmin.glyph // only export .ttf
        }))
        .pipe(gulp.dest('assets/preloader/fonts/'));
});

gulp.task('subset', function () {
    gulp.run('subsetZT');
    gulp.run('subsetZH');
    gulp.run('subsetJA');
    gulp.run('subsetKO');
});

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