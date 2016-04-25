#/bin/bash
set -ex

pushd www/
python -m SimpleHTTPServer
popd
