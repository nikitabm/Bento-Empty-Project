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
    // console.log('Error', err);
    this.emit('end');
};

// build tasks
gulp.task('build-web', ['clean', 'copy', 'concat', 'sprite'], function () {
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
gulp.task('build-cocoonjs', ['clean', 'copy', 'copyJs', 'replace', 'uglify', 'cordovaReplace', 'sprite'], function () {
    var zip = require('gulp-zip');
    return gulp.src(['build/**/*.*'], {
            base: './build'
        })
        .pipe(zip('build.zip'))
        .pipe(gulp.dest('./build'));
});
gulp.task('build-cocoontest', ['clean', 'copy', 'copyJs', 'replace', 'cordovaReplace', 'sprite'], function () {
    var zip = require('gulp-zip');
    setTimeout(function () {
        return gulp.src(['build/**/*.*'], {
                base: './build'
            })
            .pipe(zip('build.zip'))
            .pipe(gulp.dest('./build'));

    }, 1000);
});
gulp.task('watch', function () {
    gulp.watch(['js/**/*.js', 'assets/**/*', 'index.html', 'lib/**/*.js', ], ['build-cocoontest']);
});

// collect assets
gulp.task('collectLoop', [], function () {
    var isWin = (os.platform() === 'win32'),
        slash = isWin ? '\\' : '/',
        cwd = __dirname + slash;
    jsons = {};
    return gulp.src([
            'assets/**/*.json',
            'assets/**/*.png',
            'assets/**/*.mp3',
            'assets/**/*.ogg',
            'assets/**/*.ac3',
            '!assets/**/*.json.*',
            '!assets/*.json',
            '!assets/**/*.tmx',
            '!assets/**/*.tsx'
        ])
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
                    jsonfile.writeFileSync('assets/' + json + '.json', jsons[json]);
                }
            }
            return file;
        }));
});
gulp.task('collector', ['collect-assets'], function () {
    var watch = require('gulp-watch');
    watch([
        'assets/**/*',
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
gulp.task('clean', function () {
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
    // copy
    return gulp.src([
            './assets/**/*',
            '!./assets/**/images/**/*',
            './res/**/*',
            './lib/**/*',
            './index.html',
            './style.css'
        ], {
            base: './'
        })
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(gulp.dest('./build'));
});
gulp.task('concat', ['copy'], function () {
    var concat = require('gulp-concat');
    return gulp.src([
            'js/**/*.js'
        ])
        // output
        .pipe(concat('game.js'))
        .pipe(gulp.dest('build/js'));
});
gulp.task('copyJs', ['copy'], function () {
    // copy without concatting
    return gulp.src([
            'js/**/*.js'
        ])
        .pipe(gulp.dest('build/js'));
});
gulp.task('cordovaReplace', ['copy'], function () {
    // copy
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
    // copy
    return gulp.src([
            './build/js/**/*.js'
        ], {
            base: './'
        })
        .pipe(replace('DEV_MODE: true', 'DEV_MODE: false'))
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+)\/\* remove\:end \*\//g, ''))
        .pipe(gulp.dest('./'));
});
gulp.task('uglify', ['replace'], function () {
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
    var jeditor = require("gulp-json-editor");
    var currentFile;
    return gulp.src('assets/*.json')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(tap(function (file) {
            currentFile = path.basename(file.path);
            jsonFiles[currentFile] = {};
            jsonFiles[currentFile].images = [];
        }))
        .pipe(jeditor(function (json) {
            var i, image, name;
            images = [];
            if (!json.images) {
                return json;
            }
            for (image in json.images) {
                jsonFiles[currentFile].images.push(json.path + 'images/' + json.images[image]);
            }
            // edit it while we're at it
            name = currentFile.substring(0, currentFile.length - 5);
            json.images = {};
            json.images[name] = name + '.png';
            json.texturePacker = {};
            json.texturePacker[name] = currentFile;

            return json; // must return JSON object.
        }))
        .pipe(gulp.dest('./build/assets'));
});
gulp.task('sprite', ['getJSON'], function () {
    var spritesmith = require('gulp.spritesmith');
    var i, json, images = [],
        jsonName;
    var foreach = require('gulp-foreach');

    return gulp.src('assets/*.json')
        .pipe(foreach(function (stream, file) {
            json = path.basename(file.path);
            jsonName = json.substring(0, json.length - 5);
            return gulp.src(jsonFiles[json].images)
                .pipe(plumber({
                    errorHandler: onError
                }))
                .pipe(spritesmith({
                    imgName: jsonName + '/images/' + jsonName + ".png",
                    cssName: jsonName + '/json/' + json,
                    algorithm: 'binary-tree',
                    padding: 2,
                    cssTemplate: texturePackerTemplate // <-- this right here
                }))
                .pipe(gulp.dest('./build/assets/'));
        }));
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