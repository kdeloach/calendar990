#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import os.path
import argparse

from oauth2client import client, tools, file


SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
CACHE_DIR = 'cache'


def main():
    flow = client.flow_from_clientsecrets('client_secrets.json', SCOPES)

    parser = argparse.ArgumentParser(parents=[tools.argparser])
    flags = parser.parse_args()

    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

    credentials_path = os.path.join(CACHE_DIR, 'credentials.json')

    storage = file.Storage(credentials_path)
    credentials = storage.get()

    if credentials is None or credentials.invalid:
        tools.run_flow(flow, storage, flags)


if __name__ == '__main__':
    main()
