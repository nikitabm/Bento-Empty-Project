@ECHO OFF
IF NOT EXIST "../node_modules/" npm install
WHERE gulp
IF %ERRORLEVEL% NEQ 0 npm install -g gulp-cli 
WHERE ws
IF %ERRORLEVEL% NEQ 0 npm install -g local-web-server

PAUSE