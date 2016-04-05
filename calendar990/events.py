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

import pytz
import dateutil.parser

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


def fetch_events(calendar_id):
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('calendar', 'v3', http=http)

    today = datetime.datetime.utcnow()
    timeMin = (today - datetime.timedelta(days=1)).isoformat() + 'Z'
    timeMax = (today + datetime.timedelta(days=1)).isoformat() + 'Z'

    events = service.events().list(
        calendarId=calendar_id,
        fields='items(end,start,status,summary)',
        timeMin=timeMin,
        timeMax=timeMax).execute()
    return clean_json(events)


def clean_json(data):
    """Return just the fields we need for each calendar entry"""
    result = []
    for item in data['items']:
        if item['status'] != 'confirmed':
            continue

        start_time = dateutil.parser.parse(item['start']['dateTime'])
        end_time = dateutil.parser.parse(item['end']['dateTime'])

        start_time = start_time.astimezone(pytz.utc)
        end_time = end_time.astimezone(pytz.utc)

        result.append({
            'summary': item['summary'],
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
        })
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('calendar_id')
    args = parser.parse_args()
    events = fetch_events(args.calendar_id)
    print(json.dumps(events))


if __name__ == '__main__':
    main()
