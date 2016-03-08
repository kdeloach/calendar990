#!/bin/bash

set -ex

path=${BASH_SOURCE%/*}
python ${path}/../server.py
