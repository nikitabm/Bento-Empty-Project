var gulp = require('gulp');

gulp.task('default', function () {
    var inquirer = require('inquirer');
    var exitStr = 'Exit';

    var main = function () {
        var strings = {
            collectAssets: 'Collect assets',
            watchAssets: 'Automatically collect assets',
            build: 'Make a build',
            cordova: 'Cordova deployment',
            subset: 'Subset fonts'
        };

        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: 'What do you want to do?',
            choices: [
                strings.collectAssets,
                strings.watchAssets,
                strings.subset,
                strings.build,
                strings.cordova,
                exitStr
            ]
        }]).then(function (answers) {
            if (answers.question === strings.build) {
                askBuild();
            } else if (answers.question === strings.cordova) {
                askCordova();
            } else if (answers.question === strings.collectAssets) {
                gulp.start('collect-assets');
            } else if (answers.question === strings.watchAssets) {
                gulp.start('collector');
            } else if (answers.question === strings.subset) {
                gulp.start('subset');
            }
        });
    };

    var askBuild = function () {
        var strings = {
            cocoonJs: 'Cocoon release build',
            cocoonTest: 'Cocoon test build',
            web: 'Web build',
            watcher: 'Start a watcher for Cocoon test builds'
        };

        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: 'What kind of build do you want to make?',
            choices: [
                strings.cocoonJs,
                strings.cocoonTest,
                strings.web,
                strings.watcher,
                exitStr
            ]
        }]).then(function (answers) {
            if (answers.question === strings.cocoonJs) {
                gulp.run('build-cocoonjs');
            } else if (answers.question === strings.cocoonTest) {
                gulp.run('build-cocoontest');
            } else if (answers.question === strings.web) {
                gulp.run('build-web');
            } else if (answers.question === strings.watcher) {
                gulp.run('watch');
            }
        });
    };

    var askCordova = function () {
        var strings = {
            newCordovaBuild: 'Create a new Cordova project',
            prepareCordova: 'Run cordova prepare',
            copyBuildToCordova: 'Copy the build folder to Cordova',
            cordovaWatch: 'Start a Cordova watcher',
            deployAndroid: 'Make an Android build',
            deployIos: 'Make an iOS build',
            installAndroid: 'Install the current Android build on a connected device',
            runAndroid: 'Run the installed app on a connected device',
            reinstallPlugins: 'Remove Cordova plugins'
        };

        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: 'What kind of build do you want to make?',
            choices: [
                strings.newCordovaBuild,
                strings.prepareCordova,
                strings.copyBuildToCordova,
                strings.cordovaWatch,
                strings.deployAndroid,
                strings.deployIos,
                strings.installAndroid,
                strings.runAndroid,
                strings.reinstallPlugins,
                exitStr
            ]
        }]).then(function (answers) {
            if (answers.question === strings.newCordovaBuild) {
                askConfirmation('WARNING: This will delete the old Cordova project. Do you want to proceed?', function () {
                    gulp.run('build-cordova');
                }, null);
            } else if (answers.question === strings.prepareCordova) {
                gulp.run('prepare-cordova');
            } else if (answers.question === strings.copyBuildToCordova) {
                gulp.run('copy-www-cordova');
            } else if (answers.question === strings.cordovaWatch) {
                gulp.run('watch-cordova');
            } else if (answers.question === strings.deployAndroid) {
                gulp.run('deploy-android');
            } else if (answers.question === strings.deployIos) {
                gulp.run('deploy-ios');
            } else if (answers.question === strings.installAndroid) {
                gulp.run('install-android');
            } else if (answers.question === strings.runAndroid) {
                gulp.run('run-android');
            } else if (answers.question === strings.reinstallPlugins) {
                gulp.run('reinstall-plugins');
            }
        });
    };

    var askConfirmation = function (question, onAccept, onDeny) {
        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: question,
            choices: [
                'Yes',
                'No'
            ]
        }]).then(function (answers) {
            if (answers.question === 'Yes') {
                if (onAccept) {
                    onAccept();
                }
            } else if (answers.question === 'No') {
                if (onDeny) {
                    onDeny();
                }
            }
        });
    };

    main();
});