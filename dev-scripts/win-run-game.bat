@ECHO OFF
SET /A RAND=%RANDOM%%%999+8000
start "" http://localhost:%RAND%
ws -p %RAND% -d "../"