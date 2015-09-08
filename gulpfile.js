var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var addsrc = require('gulp-add-src');
var clean = require('gulp-clean');
var usemin = require('gulp-usemin');
var spritesmith = require('gulp.spritesmith');
var jeditor = require("gulp-json-editor");
var foreach = require('gulp-foreach');
var tap = require('gulp-tap');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var path = require('path');
var exec = require('child_process').exec;

var jsonFiles = {};

function texturePackerTemplate(params) {
    var items = params.items,
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
        //console.log(item)
        frames.push({
            frame: {
                x: item.x,
                y: item.y,
                w: item.width,
                h: item.height
            },
            filename: path.basename(item.source_image)
        });
    });

    return JSON.stringify(itemObj, null, 4);
}

gulp.task('clean', function () {
    return gulp.src('build', {
        read: false
    }).pipe(clean({
        force: true
    }));
});


gulp.task('copy', ['clean'], function () {
    // copy
    return gulp.src([
            './assets/**/*',
            '!./assets/**/images/*',
            './lib/**/*',
            './index.html',
            './style.css'
        ], {
            base: './'
        })
        .pipe(gulp.dest('./build'));
});

gulp.task('concat', ['copy'], function () {
    return gulp.src([
            'js/**/*.js'
        ])
        // output
        .pipe(concat('game.js'))
        .pipe(gulp.dest('build/js'));
});

gulp.task('cordovaReplace', ['concat'], function () {
    // copy
    return gulp.src([
            './build/js/game.js',
            './build/index.html'
        ], {
            base: './'
        })
        .pipe(replace('<!-- replace:cordova -->', '<script src="cordova.js"></script>'))
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+)\/\* remove\:end \*\//g, ''))
        .pipe(gulp.dest('./'));
});

gulp.task('getJSON', ['concat'], function () {
    var currentFile;
    return gulp.src('assets/*.json')
        .pipe(tap(function (file) {
            currentFile = path.basename(file.path);
            jsonFiles[currentFile] = {};
            jsonFiles[currentFile].images = [];
            //console.log(currentFile);
        }))
        .pipe(jeditor(function (json) {
            var i, image, name;
            images = [];
            //console.log(json);
            if (!json.images) {
                return json;
            }
            for (image in json.images) {
                jsonFiles[currentFile].images.push(json.path + 'images/' + json.images[image]);
                // console.log(json.path + 'images/' + json.images[image]);
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
    var i, json, images = [],
        jsonName;
    //console.log(jsonFiles);

    for (json in jsonFiles) {
        jsonName = json.substring(0, json.length - 5);
        //console.log(jsonFiles[json].images);
        //if (jsonFiles.hasOwnProperty(json)) {
        gulp.src(jsonFiles[json].images)
            .pipe(tap(function (file, t) {
                //console.log(path.basename(file.path));
            }))
            .pipe(spritesmith({
                imgName: jsonName + '/images/' + jsonName + ".png",
                cssName: jsonName + '/json/' + json,
                algorithm: 'binary-tree',
                padding: 2,
                cssTemplate: texturePackerTemplate // <-- this right here
            }))
            .pipe(gulp.dest('./build/assets/'));
        //}
    }
});

gulp.task('formatJSON', ['sprite'], function () {
    return gulp.src('assets/json/*.json')
        .pipe(tap(function (file) {
            // console.log(currentFile);
        }))
        .pipe(jeditor(function (json) {
            var frame, f, frames;
            if (!json.frames || !json.images) {
                return json;
            }
            frames = json.frames;
            json.frames = [];
            for (frame in frames) {
                f = {
                    frames: frames[frame].frame,
                    filename: frame + '.png'
                }
                json.frames.push(f);
            }
            return json;
        })).pipe(gulp.dest('./build/assets/json'));;
});

gulp.task('default', ['clean', 'copy', 'concat', 'sprite'], function () {
    // place code for your default task here

    return gulp.src(['build/index.html'], {
            base: './build'
        })
        .pipe(usemin({
            js: [uglify()]
        }))
        .pipe(gulp.dest('./build/'));
});

gulp.task('cocoonjs', ['clean', 'copy', 'concat', 'cordovaReplace', 'sprite'], function () {
    return gulp.src([
            'js/**/*.js'
        ])
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+)\/\* remove\:end \*\//g, ''))
        .pipe(uglify())
        .pipe(gulp.dest('build/js'));

});
gulp.task('cocoontest', ['clean', 'copy', 'concat', 'cordovaReplace', 'sprite'], function () {
    // don't concatanate files ????
    return gulp.src([
            'js/**/*.js'
        ])
        .pipe(replace(/\/\* remove\:start \*\/([\S+\n\r\s]+)\/\* remove\:end \*\//g, ''))
        .pipe(gulp.dest('build/js'));
});
gulp.task('watch', function () {
    gulp.watch(['js/**/*.js', 'assets/**/*', 'index.html', 'lib/**/*.js',], ['cocoontest']);
});

gulp.task('check', function () {
    // place code for your default task here
    return gulp.src(['js/**/*.js', '!js/lib/*.js'])
        .pipe(jshint({
            newcap: false
        }))
        .pipe(jshint.reporter());
});