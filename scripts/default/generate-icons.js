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
    'hdpi',
    'ldpi',
    'mdpi',
    'xhdpi',
    'xxhdpi',
    'xxxhdpi'
];
var androidIconSizes = [
    72,
    36,
    48,
    96,
    144,
    192
];

function generateIcons(done) {
    var sharp = require('sharp'); // can't get jimp to work nowadays 
    var iconPath = path.join('.', 'res', 'icon.png');
    var output = 'Copy paste the following into config.xml:\n\n';
    var resizeIcon = function (size, newPath, platform) {
        var filePath = path.join('res', platform, newPath + '.png');
        var image = sharp(iconPath);
        image.metadata().then(function (metaData) {
            // resize image and save

            if (!fs.existsSync(path.join('res', platform))) {
                fs.mkdir(path.join('res', platform));
                return;
            }

            image.resize(size, size).toFile(filePath);
        });
        if (platform === 'ios') {
            output += '    <icon src="' + filePath + '" width="' + size + '" height="' + size + '" />\n';
        } else if (platform === 'android') {
            output += '    <icon src="' + filePath + '" density="' + newPath + '" />\n';
        }

    };

    if (!fs.existsSync(iconPath)) {
        console.error(iconPath + ' does not exist!');
        done();
        return;
    }
    // iOS
    output += '<platform name="ios">\n';
    Utils.forEach(iosIcons, function (newPath, i) {
        var size = iosIconSizes[i];
        resizeIcon(size, newPath, 'ios');
    });
    output += '</platform>\n';

    // Android
    output += '<platform name="android">\n';
    Utils.forEach(androidIcons, function (newPath, i) {
        var size = androidIconSizes[i];
        resizeIcon(size, newPath, 'android');
    });
    output += '</platform>\n';

    console.log(output);
    done();
}
gulp.task('generate-icons', generateIcons);