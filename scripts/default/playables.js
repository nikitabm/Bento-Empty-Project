var gulp = require('gulp');
var path = require('path');
var fs = require('fs');

var ask = function(question, callback) {
    var readline = require('readline');
    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.question(question, function(answer) {
        rl.close();
        if (callback) {
            callback(answer);
        }
    });
};
var copyFileSync = function(source, target) {
    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
};
var upload = function(client, localFile, remoteFile, callback) {
    var params = {
        localFile: localFile,
        s3Params: {
            Bucket: 'lucky-kat',
            Key: remoteFile,
            ACL: 'public-read'
            // other options supported by putObject, except Body and ContentLength.
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        },
    };
    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
        console.error("unable to upload:", err.stack);
    });
    uploader.on('end', function() {
        callback();
    });
};

function compressGameJs(done) {
    var lzString = require('lz-string');
    var template = fs.readFileSync(path.join('scripts', 'default', 'template.js'), 'utf8');
    var gameJs = fs.readFileSync(path.join('www', 'js', 'game.js'), 'utf8');
    template = template.replace('<insert string here>', lzString.compressToBase64(gameJs));
    fs.writeFileSync(path.join('www', 'js', 'game.js'), template);
    done();
}
compressGameJs.description = "Compresses game.js and auto decompresses when it's run";

function resizeImages(done) {
    var Jimp = require('jimp');
    var toResize = [];
    var resizeFactor = 0.75;
    // resize icon
    var resize = function(inputPath, outputPath, onComplete) {
        Jimp.read(inputPath, function(err, image) {
            if (err) {
                throw err;
            }
            if (inputPath.indexOf('spritesheets') >= 0) {
                // spritesheets need to have their origin edited
                var jsonPath = inputPath.replace('.png', '.json');
                var json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                json.origin.x *= resizeFactor;
                json.origin.y *= resizeFactor;
                fs.writeFileSync(jsonPath, JSON.stringify(json));
            }
            image.resize(
                Math.max(1, image.bitmap.width * resizeFactor),
                Math.max(1, image.bitmap.height * resizeFactor)
            );
            image.write(outputPath, onComplete);
        });
    };
    var walkSync = function(currentDirPath, onFile) {
        // enumerate
        fs.readdirSync(currentDirPath).forEach(function(name) {
            var filePath = path.join(currentDirPath, name);
            var stat = fs.statSync(filePath);
            if (stat.isFile()) {
                onFile(filePath, stat);
            } else if (stat.isDirectory()) {
                walkSync(filePath, onFile);
            }
        });
    };

    walkSync(path.join('www', 'assets'), function(filePath) {
        if (filePath.endsWith('.png') && filePath.indexOf('item-icons') < 0) {
            toResize.push(new Promise(function(resolve, reject) {
                resize(filePath, filePath, resolve);
            }));
        }
    });
    return Promise.all(toResize);
}
resizeImages.description = "Resizes images";

function pngQuant(callback) {
    var pngquant = require('gulp-pngquant');
    var cache = require('gulp-cache');
    return gulp.src([
            './www/assets/**/*.png'
        ], {
            base: './'
        })
        .pipe(cache(
            // imagemin(), {
            //     name: 'imagemin'
            // }
            pngquant({
                quality: '90-100',
                nofs: '--quality=90-100'
            }), {
                name: 'pngquant'
            }
        ))
        .pipe(gulp.dest('./'));
}

// tasks
gulp.task('pngQuant', pngQuant);
gulp.task('compress-game-js', compressGameJs);
gulp.task('resize-images', resizeImages);
gulp.task('upload-playable', function(callback) {
    var s3 = require('s3');
    var s3Key = "";
    var s3Secret = "";
    if (s3Key !== "" && s3Secret !== "") {
        var client = s3.createClient({
            maxAsyncS3: 20, // this is the default 
            s3RetryCount: 3, // this is the default 
            s3RetryDelay: 1000, // this is the default 
            multipartUploadThreshold: 20971520, // this is the default (20 MB) 
            multipartUploadSize: 15728640, // this is the default (15 MB) 
            s3Options: {
                accessKeyId: s3Key,
                secretAccessKey: s3Secret,
            },
        });
        console.log(client);
        var gameName = 'gameName';
        ask('Name? ', function(name) {
            console.log('Uploading...');
            upload(
                client,
                path.join("www", "index.html"),
                gameName + "/playables/" + name + ".html",
                function() {
                    console.log('Uploaded to https://lucky-kat.s3.amazonaws.com/' + gameName + '/playables/' + name + ".html");
                    copyFileSync(path.join("www", "index.html"), path.join("build", name + ".html"));
                    callback();
                }
            );
        });
    }
});