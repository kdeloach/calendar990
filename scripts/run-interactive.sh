#!/bin/bash

set -ex

docker run \
    -v $PWD/calendar990:/src/calendar990 \
    -p 5000:80 \
    -p 9001:9001 \
    --rm \
    -ti \
    docker-calendar \
    bash
