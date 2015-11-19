node build.js
node build.js --minify
echo 'copy to ma3dViewer/trunk/lib/GIScene/'
cp ../builds/GIScene_1.0.1dev1.js ../../ma3dViewer/trunk/lib/GIScene/
cp ../builds/GIScene_min_1.0.1dev1.js ../../ma3dViewer/trunk/lib/GIScene/
echo 'copy to LoS-TestClient/lib/GIScene/'
cp ../builds/GIScene_1.0.1dev1.js ../../LoS-TestClient/lib/GIScene/
cp ../builds/GIScene_min_1.0.1dev1.js ../../LoS-TestClient/lib/GIScene/
echo 'done'
