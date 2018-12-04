# Bento Project Template

Use this project as a starting point for Bento projects. 

## Installation

Just download the whole git repo.

## Getting started

### Running the game

Typically you can simply get started using any webserver to host the game and any text editor to edit the js files. A simple and free to use webserver is [MAMP](https://www.mamp.info/en/).

### Scripts

Included in this project are some useful scripts. Typically to make deployments of the game or adding assets. Install [node.js](https://nodejs.org/en/). Open Terminal (Mac OS) or cmd (Windows), navigate to the project folder and run `npm install`.

Also needed is a global npm package Gulp `npm install -g gulp-cli`. Some scripts may require FFmpeg for audio conversions.

These gulp commands are for adding assets to the game.

* `gulp collect-assets`: Collects all assets to load in assets.json. (Much easier than managing assets by hand)
* `gulp collector`: Watches the assets folder. Placing assets in the `/assets` folder automatically runs collect-assets.

### Deploying

Deploying to iOS or Android requires Cordova: `npm install -g cordova`

* `gulp build`: For deploying a generic Cordova build
* `gulp build-web`: For deploying a web build, minifies and concatenates Javascript files and applies strong compressions. 
* `gulp build-compact`: Web build withall assets inlined into an HTML file.
* `gulp build-cocoonjs`: For deploying a Cocoon.io project. Minifies Javascript files, inserts Cordova references.
* `gulp prepare-cordova`: Runs `cordova prepare` in the cordova project after a build.
* `gulp deploy-android`: Builds and signs an apk

### Changelog

v1.2.1
* Adding a version number matching the Bento version
* Cordova project is no longer in the `/cordova` folder. Instead, the root folder is a Cordova project folder. All cordova commands will work from the root. As a result, the `/build` folder is now `/www` and `/cordova/build-deployments` is now `/build`. Note that config.xml is now maintained by Cordova, so it will reformat and remove comments from it. 
* `gulp clean` is added to clean the cordova project. Will delete `/platforms` and `/plugins`. Also edits package.json: removes the cordova and dependencies groups, as Cordova >=7 mirrors config.xml. Appropiate changes will be made once Cordova decides to sunset config.xml, until then we must work with both files. 
* `gulp build-cocoontest` is removed. `gulp build` is the default Cordova build, also usable for Web (Web deployments still prefer `gulp build-web`);
* Updated all gulp tasks to gulp 4, use `npm install -i gulp-cli` to upgrade.
* Added a `gulp generate-icons` task to generate app icons from `res/icon.png`. Default icons are also added as well as a universal splash screen for iOS.
* PixiJS v3 is added and set as default renderer.
