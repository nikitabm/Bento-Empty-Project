var gulp = require('gulp');
var inquirer = require('inquirer');

gulp.task('default', function () {
    var exitStr = 'Exit';

    var main = function () {
        var strings = {
            collectAssets: 'Collect assets',
            watchAssets: 'Automatically collect assets',
            build: 'Make a build'
        };

        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: 'What do you want to do?',
            choices: [
                strings.collectAssets,
                strings.watchAssets,
                strings.build,
                exitStr
            ]
        }]).then(function (answers) {
            if (answers.question === strings.build) {
                askBuild();
            } else if (answers.question === strings.collectAssets) {
                gulp.start('collect-assets');
            } else if (answers.question === strings.watchAssets) {
                gulp.start('collector');
            }
        });
    };

    var askBuild = function () {
        var strings = {
            cocoonJs: 'Cocoon release build',
            cocoonTest: 'Cocoon test build (not minified)',
            web: 'Web build',
            watcher: 'Start a watcher for Cocoon test builds'
        };

        inquirer.prompt([{
            type: 'list',
            name: 'question',
            message: 'What kind of build do you want to make?',
            choices: [
                strings.web,
                strings.cocoonJs,
                strings.cocoonTest,
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