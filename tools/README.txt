To generate single file builds of GIScene:

1. Make sure you have installes NodeJS

To build a single file type in the command line:

node build.js --sourcefiles ./build_GIScene.json //everything

OR

node build.js --sourcefiles ./build_GIScene_basic.json --output ../builds/GIScene_basic.js   //just basic without processes and shadermaterials and postprocessing


To build a MINIFIED single file type in the command line:

node build.js --minify //builds everything

OR

node build.js --minify --sourcefiles ./build_GIScene_basic.json --output ../builds/GIScene_basic.js //just basic without processes and shadermaterials and postprocessing


The result will be stored in GIScene/builds folder!

===========

To create the docs:

Install yuidoc: npm -g install yuidocjs

0. Change the version in yuidoc.json
1. Go to /lib
2. Run: yuidoc . in the command line