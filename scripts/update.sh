#!/bin/bash

set -ex

GIT_COMMIT="$(git rev-parse HEAD)"
echo $GIT_COMMIT > $PWD/version.txt

docker-compose build
