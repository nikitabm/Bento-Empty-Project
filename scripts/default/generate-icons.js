/* jshint esversion:6 */

var Utils = require('./utils');
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

var iosIcons = [
    'icon-20',
    'icon-20@2x',
    'icon-20@3x',
    'icon-29',
    'icon-29@2x',
    'icon-29@3x',
    'icon-40',
    'icon-40@2x',
    'icon-40@3x',
    'icon-50',
    'icon-50@2x',
    'icon-50@3x',
    'icon-57',
    'icon-57@2x',
    'icon-60@2x',
    'icon-60@3x',
    'icon-72',
    'icon-72@2x',
    'icon-76',
    'icon-76@2x',
    'icon-83.5@2x',
    'icon-120',
    'icon-512',
    'icon-512@2x'
];
var iosIconSizes = [
    20,
    20 * 2,
    20 * 3,
    29,
    29 * 2,
    29 * 3,
    40,
    40 * 2,
    40 * 3,
    50,
    50 * 2,
    50 * 3,
    57,
    57 * 2,
    60 * 2,
    60 * 3,
    72,
    72 * 2,
    76,
    76 * 2,
    83.5 * 2,
    120,
    512,
    512 * 2
];
var androidIcons = [
    'ldpi',
    'mdpi',
    'hdpi',
    'xhdpi',
    'xxhdpi',
    'xxxhdpi'
];
var androidIconSizes = [
    36, // ldpi
    48, // mdpi
    72, // hdpi
    96, // xhdpi
    144, // xxhdpi
    192 // xxxhdpi
];
var androidAdaptiveIconSizes = [
    54, // ldpi
    108, // mdpi
    162, // hdpi
    216, // xhdpi
    324, // xxhdpi
    432 // xxxhdpi
];
var ic_launcher_xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

function generateIcons(done) {
    var Jimp = require('jimp');
    var iconPath = path.join('.', 'res', 'icon.png');
    var iconForeground = path.join('.', 'res', 'icon-foreground.png');
    var iconBackground = path.join('.', 'res', 'icon-background.png');
    var shouldGenerateAdaptive = (
        fs.existsSync(iconForeground) && 
        fs.existsSync(iconBackground) && 
        fs.existsSync(path.join('platforms', 'android', 'app', 'src', 'main', 'res'))
    );
    var output = 'Copy paste the following into config.xml:\n\n';
    var todo = 0;
    var resized = 0;
    // resize icon
    var resizeIcon = function (inputPath, outputPath, size, onComplete) {
        Jimp.read(inputPath, function (err, image) {
            if (err) {
                throw err;
            }
            image.resize(size, size);
            image.write(outputPath, onComplete);
        });
    };
    // resize icon and save the output path
    var resizeAndPrint = function (size, iconType, platform) {
        var outputPath = path.join('res', platform, iconType + '.png');

        // make platform folders in res/
        if (!fs.existsSync(path.join('res', platform))) {
            fs.mkdirSync(path.join('res', platform));
        }

        resizeIcon(iconPath, outputPath, size, function () {
            resized += 1;

            if (resized >= todo) {
                done();
            }
        });

        if (platform === 'ios') {
            output += '    <icon src="' + outputPath + '" width="' + size + '" height="' + size + '" />\n';
        } else if (platform === 'android') {
            output += '    <icon src="' + outputPath + '" density="' + iconType + '" />\n';
        }
    };
    // Android only: adaptive icons
    var resizeAdaptiveAndPrint = function (size, iconType) {
        var outputForeground = path.join('res', 'android', 'mipmap-' + iconType + '-v26', 'ic_launcher_foreground.png');
        var outputBackground = path.join('res', 'android', 'mipmap-' + iconType + '-v26', 'ic_launcher_background.png');
        var targetForeground = path.join('app', 'src', 'main', 'res', 'mipmap-' + iconType + '-v26', 'ic_launcher_foreground.png');
        var targetBackground = path.join('app', 'src', 'main', 'res', 'mipmap-' + iconType + '-v26', 'ic_launcher_background.png');
        var onComplete = function () {
            resized += 1;

            if (resized >= todo) {
                done();
            }
        };

        // make 'android' folders in res/
        if (!fs.existsSync(path.join('res', 'android'))) {
            fs.mkdirSync(path.join('res', 'android'));
        }
        if (!fs.existsSync(path.join('res', 'android', 'mipmap-' + iconType + '-v26'))) {
            fs.mkdirSync(path.join('res', 'android', 'mipmap-' + iconType + '-v26'));
        }

        resizeIcon(iconForeground, outputForeground, size, onComplete);
        resizeIcon(iconBackground, outputBackground, size, onComplete);

        output += '    <resource-file src="' + outputForeground + '" target="' + targetForeground + '" />\n';
        output += '    <resource-file src="' + outputBackground + '" target="' + targetBackground + '" />\n';
    };

    if (!fs.existsSync(iconPath)) {
        console.error(iconPath + ' does not exist!');
        done();
        return;
    }

    todo += iosIconSizes.length;
    todo += androidIconSizes.length;

    if (shouldGenerateAdaptive) {
        todo += androidIconSizes.length * 2;
    }

    // iOS
    output += '<platform name="ios">\n';
    Utils.forEach(iosIcons, function (iconType, i) {
        var size = iosIconSizes[i];
        resizeAndPrint(size, iconType, 'ios');
    });
    output += '</platform>\n';

    // Android legacy icons
    output += '<platform name="android">\n    <!-- Legacy icons -->\n';
    Utils.forEach(androidIcons, function (iconType, i) {
        var size = androidIconSizes[i];
        resizeAndPrint(size, iconType, 'android');
    });
    // Android adaptive icons
    if (shouldGenerateAdaptive) {
        output += '    <!-- Adaptive icons -->\n';
        // add xml if needed
        if (!fs.existsSync(path.join('res', 'android', 'mipmap-anydpi-v26'))) {
            fs.mkdirSync(path.join('res', 'android', 'mipmap-anydpi-v26'));
        }
        if (!fs.existsSync(path.join('res', 'android', 'mipmap-anydpi-v26', 'ic_launcher.xml'))) {
            fs.writeFileSync(path.join('res', 'android', 'mipmap-anydpi-v26', 'ic_launcher.xml'), ic_launcher_xml);
        }
        Utils.forEach(androidIcons, function (iconType, i) {
            var size = androidAdaptiveIconSizes[i];
            resizeAdaptiveAndPrint(size, iconType);
        });
    }
    output += '</platform>\n';

    console.log(output);
    // done();
}
generateIcons.description = "Generates a set of icons from res/icon.png";

gulp.task('generate-icons', generateIcons);