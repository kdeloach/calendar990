#/bin/bash
set -ex

. /opt/env.sh

ARGS=$*

python /vagrant/collect.py "$ARGS" > /vagrant/www/events.json
