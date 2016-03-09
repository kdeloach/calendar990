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

from datetime import date, datetime, timedelta

from apiclient import discovery
from oauth2client import file


USER_AGENT = 'Azavea conference room schedule'
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

    timeMin = date.today().strftime('%Y-%m-%dT00:00:00Z')
    timeMax = date.today().strftime('%Y-%m-%dT23:59:59Z')

    events = service.events().list(
        calendarId=args.calendar_id,
        timeMin=timeMin, timeMax=timeMax).execute()
    print(json.dumps(events))


if __name__ == '__main__':
    main()
