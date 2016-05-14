#!/bin/bash
set -ex

git rev-parse HEAD > www/version.txt

vagrant up --provision
vagrant ssh -c '/vagrant/scripts/publish.sh'
