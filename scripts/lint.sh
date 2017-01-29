#!/bin/bash

set -ex

docker-compose run --rm \
    --entrypoint /usr/local/bin/jshint \
    app-node main.js
