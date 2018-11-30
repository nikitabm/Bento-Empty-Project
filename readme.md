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
