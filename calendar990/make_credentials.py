#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import sys
import os.path
import argparse

from oauth2client import client, tools, file


SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

SECRETS_PATH = os.environ['SECRETS_PATH']
CLIENT_SECRETS_PATH = os.path.join(SECRETS_PATH, 'client_secrets.json')
CREDENTIALS_PATH = os.path.join(SECRETS_PATH, 'credentials.json')


def main():
    if not os.path.exists(CLIENT_SECRETS_PATH):
        print('Required file not found: ' + CLIENT_SECRETS_PATH)
        sys.exit(1)

    flow = client.flow_from_clientsecrets(CLIENT_SECRETS_PATH, SCOPES)

    parser = argparse.ArgumentParser(parents=[tools.argparser])
    flags = parser.parse_args()

    storage = file.Storage(CREDENTIALS_PATH)
    tools.run_flow(flow, storage, flags)


if __name__ == '__main__':
    main()
