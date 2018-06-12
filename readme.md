# Empty Bento Project

Use this project as a starting point for Bento projects. 

## Installation

Just download the whole git repo.

## Gulp

Want to use gulp manually? Use these commands:

* `gulp collect-assets`: Collects all assets to load in assets.json. (Much easier than managing assets by hand)
* `gulp collector`: Watches the assets folder. Placing assets in the assets folder automatically runs collect-assets.
* `gulp build-web`: For deploying a web build: minifies and concatenates Javascript files and applies texture packer on images. 
* `gulp build-cocoonjs`: For deploying a Cocoon.io project. Minifies Javascript files, inserts Cordova references.
* `gulp build-cocoontest`: Builds a Cocoon.io project without minifying (easier for debugging).
* `gulp watch`: Watches the assets and js folder. Automatically runs build-cocoontest
* `gulp build-cordova`: Creates a cordova project (NOTE: requires cordova 6.5.0 or lower)
* `gulp prepare-cordova`: Runs `cordova prepare` in the cordova project
* `gulp deploy-android`: Builds and signs an apk

