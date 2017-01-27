#!/bin/bash

set -ex

docker-compose run --rm \
    --entrypoint /bin/sh \
    app -c '/usr/local/bin/aws s3 sync --delete /usr/src s3://${S3_BUCKET}'
