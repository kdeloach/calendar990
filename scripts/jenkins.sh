#!/bin/bash
set -ex

git describe --tags --always --dirty > www/version.txt

vagrant up --provision
vagrant ssh -c '/vagrant/scripts/collect.sh'
vagrant ssh -c '/vagrant/scripts/publish.sh'
