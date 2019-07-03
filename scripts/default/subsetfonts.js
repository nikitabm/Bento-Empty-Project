/**
 * Subsetting is something that really depends on the game. Any game could be using any font for a
 * language. So the name of the fonts should be written down here extra.
 */
var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var Utils = require('./utils');

var fonts = {
    KO: ['assets/preloader/fonts/korean-bold.ttf'],
    JA: ['assets/preloader/fonts/japanese.ttf', 'assets/preloader/fonts/japanese-bold.ttf'],
    ZH: ['assets/preloader/fonts/chinese.ttf'],
    ZT: ['assets/preloader/fonts/chinese-trad.ttf']
};

/**
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
    return gulp.src('assets/preloader/json/**/zt.json')
        .pipe(jeditor(function (json) {
            charsZT += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});
function subsetZt(done) {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    var exists = true;
    Utils.forEach(fonts.ZT || [], function (filePath) {
        if (!fs.existsSync(filePath)) {
            exists = false;
            console.log('Warning: ' + filePath + ' does not exist. Skipping subset.');
        }
    });
    if (!exists) {
        done();
        return;
    }
    return gulp.src(fonts.ZT)
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsZT
            })]
        }))
        .pipe(gulp.dest('www/assets/preloader/fonts/'));
}
gulp.task('subsetZT', gulp.series('getCharactersZT', subsetZt));

gulp.task('getCharactersZH', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/json/**/zh.json')
        .pipe(jeditor(function (json) {
            charsZH += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

function subsetZH (done) {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    var exists = true;
    Utils.forEach(fonts.ZH || [], function (filePath) {
        if (!fs.existsSync(filePath)) {
            exists = false;
            console.log('Warning: ' + filePath + ' does not exist. Skipping subset.');
        }
    });
    if (!exists) {
        done();
        return;
    }
    return gulp.src(fonts.ZH)
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsZH
            })]
        }))
        .pipe(gulp.dest('www/assets/preloader/fonts/'));
}
gulp.task('subsetZH', gulp.series('getCharactersZH', subsetZH));

gulp.task('getCharactersJA', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/json/**/ja.json')
        .pipe(jeditor(function (json) {
            charsJA += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

function subsetJa (done) {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    var exists = true;
    Utils.forEach(fonts.JA || [], function (filePath) {
        if (!fs.existsSync(filePath)) {
            exists = false;
            console.log('Warning: ' + filePath + ' does not exist. Skipping subset.');
        }
    });
    if (!exists) {
        done();
        return;
    }
    return gulp.src(fonts.JA)
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsJA
            })]
        }))
        .pipe(gulp.dest('www/assets/preloader/fonts/'));
}
gulp.task('subsetJA', gulp.series('getCharactersJA', subsetJa));

gulp.task('getCharactersKO', function () {
    var jeditor = require("gulp-json-editor");
    return gulp.src('assets/preloader/json/**/ko.json')
        .pipe(jeditor(function (json) {
            charsKO += JSON.stringify(json);
            return json; // must return JSON object.
        }));
});

function subsetKo (done) {
    var gulpFontmin = require('gulp-fontmin');
    var Fontmin = require('fontmin');
    var exists = true;
    Utils.forEach(fonts.KO || [], function (filePath) {
        if (!fs.existsSync(filePath)) {
            exists = false;
            console.log('Warning: ' + filePath + ' does not exist. Skipping subset.');
        }
    });
    if (!exists) {
        done();
        return;
    }
    return gulp.src(fonts.KO)
        .pipe(gulpFontmin({
            use: [Fontmin.glyph({
                text: charsKO
            })]
        }))
        .pipe(gulp.dest('www/assets/preloader/fonts/'));
}
gulp.task('subsetKO', gulp.series('getCharactersKO', subsetKo));

gulp.task('editGulpFontMin', function (done) {
    var indexJs;
    var indexJsPath = path.join('.', 'node_modules', 'gulp-fontmin', 'index.js');
    // edit gulp-fontmin/index.js
    if (fs.existsSync(indexJsPath)) {
        indexJs = fs.readFileSync(indexJsPath, 'utf-8');
        indexJs = indexJs.replace('.use(Fontmin.ttf2eot())', '');
        indexJs = indexJs.replace('.use(Fontmin.ttf2woff())', '');
        indexJs = indexJs.replace('.use(Fontmin.ttf2svg())', '');
        indexJs = indexJs.replace('.use(Fontmin.css(opts))', '');
        fs.writeFileSync(indexJsPath, indexJs);
        done();
    } else {
        console.log('ERROR: could not find ' + indexJsPath + ' This files needs to be edited.');
        done();
        return;
    }
});

gulp.task('subset',
    gulp.series(
        'editGulpFontMin',
        gulp.parallel(
            'subsetZT',
            'subsetZH',
            'subsetJA',
            'subsetKO'
        )
    )
);