#/bin/bash
set -ex

pushd www/
python -m SimpleHTTPServer 8001
popd
