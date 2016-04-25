#!/bin/bash
set -ex

cd /vagrant

apt-get update
apt-get install -y python-dev python-setuptools

easy_install pip
pip install -r requirements.txt

cat > /opt/env.sh <<EOF
export BUCKET=$BUCKET
export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
EOF
