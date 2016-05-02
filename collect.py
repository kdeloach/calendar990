#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import sys
import os
import os.path
import httplib2
import datetime
import json
import logging
import argparse

import pytz
import dateutil.parser

from apiclient import discovery
from oauth2client import file


logging.basicConfig(format='%(asctime)s %(message)s', level=logging.DEBUG)

EST = pytz.timezone('US/Eastern')

USER_AGENT = 'Azavea Calendar990'
CREDENTIALS_PATH = '/vagrant/credentials.json'

CALENDARS = (
    ('Chicago', 'azavea.com_37323531353137392d3335@resource.calendar.google.com'),
    ('Istanbul', 'azavea.com_2d3832333338333036313739@resource.calendar.google.com'),
    ('Jakarta', 'azavea.com_2d3937313336363332343536@resource.calendar.google.com'),
    ('Kiev', 'azavea.com_2d33363732373535372d383539@resource.calendar.google.com'),
    ('London', 'azavea.com_32313332323030362d333532@resource.calendar.google.com'),
    ('Madrid', 'azavea.com_2d3433323639353434333335@resource.calendar.google.com'),
    ('Mumbai', 'azavea.com_2d3531323935383832313738@resource.calendar.google.com'),
    ('Nairobi', 'azavea.com_2d35373131323734362d383139@resource.calendar.google.com'),
    ('New York', 'azavea.com_3336343733393238383535@resource.calendar.google.com'),
    ('Oslo', 'azavea.com_39393439323539323133@resource.calendar.google.com'),
    ('Paris', 'azavea.com_2d34343937353334392d353230@resource.calendar.google.com'),
    ('Saigon', 'azavea.com_2d39343638333133382d393132@resource.calendar.google.com'),
    ('Salta', 'azavea.com_2d3530363332393734333633@resource.calendar.google.com'),
    ('Shanghai', 'azavea.com_2d313034383935352d393134@resource.calendar.google.com'),
    ('Springfield', 'azavea.com_2d36333733303039323735@resource.calendar.google.com'),
    ('Stockholm', 'azavea.com_2d3938333739393434383537@resource.calendar.google.com'),
    ('Sydney', 'azavea.com_39383537323133383131@resource.calendar.google.com'),
    ('Tokyo', 'azavea.com_3732333135313339353335@resource.calendar.google.com'),
    ('Toronto', 'azavea.com_323532323135382d383738@resource.calendar.google.com'),
)


def get_credentials():
    if not os.path.exists(CREDENTIALS_PATH):
        logging.error('Credentials not found; Run make_credentials.py')
        sys.exit(1)

    storage = file.Storage(CREDENTIALS_PATH)
    credentials = storage.get()

    if credentials is None or credentials.invalid:
        logging.error('Invalid credentials; Run make_credentials.py')
        sys.exit(1)

    return credentials


def fetch_events(now_utc, calendar_id):
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('calendar', 'v3', http=http)

    timeMin = (now_utc - datetime.timedelta(days=1)).isoformat()
    timeMax = (now_utc + datetime.timedelta(days=1)).isoformat()

    events = service.events().list(
        calendarId=calendar_id,
        singleEvents=True,
        fields=','.join([
            'description',
            'items(id)',
            'items(start)',
            'items(end)',
            'items(description)',
            'items(htmlLink)',
            'items(status)',
            'items(summary)',
        ]),
        timeMin=timeMin,
        timeMax=timeMax).execute()

    return clean_json(now_utc, events)


def clean_json(now_utc, data):
    """Return just the fields we need for each calendar entry"""
    result = []
    for item in data['items']:
        if item.get('status', '') != 'confirmed':
            continue

        start_time = dateutil.parser.parse(item['start']['dateTime'])
        end_time = dateutil.parser.parse(item['end']['dateTime'])

        start_time = start_time.astimezone(pytz.utc)
        end_time = end_time.astimezone(pytz.utc)

        id = item.get('id', '')
        summary = item.get('summary', '')
        description = item.get('description', '')
        htmlLink = item.get('htmlLink', '')

        result.append({
            'id': id,
            'summary': summary,
            'description': description,
            'htmlLink': htmlLink,
            'startTime': start_time.isoformat(),
            'endTime': end_time.isoformat(),
        })
    return result


def make_slug(name):
    return name.lower().replace(' ', '-')


def calendars_json(now_utc, debug=False):
    rooms = []

    for name, calendar_id in CALENDARS:
        slug = make_slug(name)
        events = calendar_events(now_utc, calendar_id)
        rooms.append({
            'id': slug,
            'name': name,
            'events': events,
        })

    result = {
        'debug': debug,
        'updatedAt': now_utc.isoformat() + 'Z',
        'rooms': rooms,
    }

    return result


def calendar_events(now_utc, calendar_id):
    try:
        logging.info('Downloading {}'.format(calendar_id))
        return fetch_events(now_utc, calendar_id)
    except Exception:
        logging.exception('Error downloading {}'.format(calendar_id))
    return []


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('now_est', nargs='?',
                        help='Time period (EST) to use for querying events'
                             '(enables debug mode)')
    args = parser.parse_args()

    debug = False

    if args.now_est:
        debug = True
        now_est = EST.localize(dateutil.parser.parse(args.now_est))
        now_utc = now_est.astimezone(pytz.utc)
    else:
        now_utc = datetime.datetime.utcnow().replace(tzinfo=pytz.utc)

    print(json.dumps(calendars_json(now_utc, debug=debug)))
