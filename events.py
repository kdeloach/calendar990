#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import argparse
import httplib2
import os
import os.path
import datetime
import json

from apiclient import discovery
from oauth2client import file


USER_AGENT = 'Conf cal test'
CACHE_DIR = 'cache'


def get_credentials():
    if not os.path.exists(CACHE_DIR):
        raise Exception('Missing cache dir; Run ./make_credentials.py')

    credentials_path = os.path.join(CACHE_DIR, 'credentials.json')

    storage = file.Storage(credentials_path)
    credentials = storage.get()

    if credentials is None or credentials.invalid:
        raise Exception('Invalid credentials; Run ./make_credentials.py')

    return credentials


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('calendar_id')
    args = parser.parse_args()

    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('calendar', 'v3', http=http)

    now = (datetime.datetime.utcnow()
           - datetime.timedelta(hours=8)).isoformat() + 'Z'
    events = service.events().list(
        calendarId=args.calendar_id,
        timeMin=now, maxResults=10, singleEvents=True,
        orderBy='startTime').execute()
    print(json.dumps(events))


if __name__ == '__main__':
    main()
