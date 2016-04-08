#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import os.path
import json
import logging

from events import fetch_events


log = logging.getLogger(__name__)

DATA_PATH = os.environ['DATA_PATH']

CALENDARS = (
    ('chicago', 'azavea.com_37323531353137392d3335@resource.calendar.google.com'),
    ('istanbul', 'azavea.com_32313332323030362d333532@resource.calendar.google.com'),
    ('jakarta', 'azavea.com_2d3937313336363332343536@resource.calendar.google.com'),
    ('kiev', 'azavea.com_2d33363732373535372d383539@resource.calendar.google.com'),
    ('london', 'azavea.com_2d3832333338333036313739@resource.calendar.google.com'),
    ('madrid', 'azavea.com_2d3433323639353434333335@resource.calendar.google.com'),
    ('mumbai', 'azavea.com_2d3531323935383832313738@resource.calendar.google.com'),
    ('nairobi', 'azavea.com_2d35373131323734362d383139@resource.calendar.google.com'),
    ('new-york', 'azavea.com_3336343733393238383535@resource.calendar.google.com'),
    ('oslo', 'azavea.com_39393439323539323133@resource.calendar.google.com'),
    ('paris', 'azavea.com_2d34343937353334392d353230@resource.calendar.google.com'),
    ('saigon', 'azavea.com_2d39343638333133382d393132@resource.calendar.google.com'),
    ('salta', 'azavea.com_2d3530363332393734333633@resource.calendar.google.com'),
    ('shanghai', 'azavea.com_2d313034383935352d393134@resource.calendar.google.com'),
    ('springfield', 'azavea.com_2d36333733303039323735@resource.calendar.google.com'),
    ('stockholm', 'azavea.com_2d3938333739393434383537@resource.calendar.google.com'),
    ('sydney', 'azavea.com_39383537323133383131@resource.calendar.google.com'),
    ('tokyo', 'azavea.com_3732333135313339353335@resource.calendar.google.com'),
    ('toronto', 'azavea.com_323532323135382d383738@resource.calendar.google.com'),
)


def download_calendar(name, calendar_id):
    filename = os.path.join(DATA_PATH, name + '.json')
    with open(filename, 'w') as fp:
        log.info('Downloading {}'.format(calendar_id))
        events = fetch_events(calendar_id)
        fp.write(json.dumps(events))


def main():
    ch = logging.StreamHandler()
    log.setLevel(logging.DEBUG)
    log.addHandler(ch)

    for name, calendar_id in CALENDARS:
        try:
            download_calendar(name, calendar_id)
        except Exception:
            log.exception('Error downloading {} ({})'.format(calendar_id, name))


if __name__ == '__main__':
    main()
