# Empty Bento Project

Use this project as a starting point for Bento projects 

## Installation

Install Node.js and use `npm install` or `sudo npm install` on Mac. Also install gulp.js. There are several `gulp` commands:
* `gulp collect-assets`: Collects all assets to load in assets.json. (Much easier than managing assets by hand)
* `gulp collector`: Watches the assets folder. Placing assets in the assets folder automatically runs collect-assets.
* `gulp build-web`: For deploying a web build: minifies and concatenates Javascript files and applies texture packer on images. 
* `gulp build-cocoonjs`: For deploying a Cocoon.io project. Minifies Javascript files, inserts Cordova references.
* `gulp build-cocoontest`: Builds a Cocoon.io project without minifying (easier for debugging).
* `gulp watch`: Watches the assets and js folder. Automatically runs build-cocoontest
