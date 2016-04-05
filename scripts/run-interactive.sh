#!/bin/bash

set -ex

docker run \
    -p 5000:80 \
    -p 9001:9001 \
    --rm \
    -ti \
    docker-calendar \
    bash
