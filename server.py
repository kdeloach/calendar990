#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import json
import pytz
import dateutil.parser
from datetime import datetime

from flask import Flask, render_template, abort, jsonify


app = Flask(__name__)

EST = pytz.timezone('US/Eastern')
DATETIME_MIN = datetime.min.replace(tzinfo=pytz.utc)
DATETIME_MAX = datetime.max.replace(tzinfo=pytz.utc)


@app.route('/')
def view_all_rooms():
    try:
        rooms_list = get_all_rooms_json()
    except IOError:
        abort(404)
    return render_template('list.html', rooms=rooms_list)


@app.route('/<room>')
def view_room(room):
    try:
        room_json = get_room_json(room)
    except IOError:
        abort(404)
    return render_template('detail.html', room=room_json)


@app.route('/<room>.json')
@app.route('/.json', defaults={'room': ''})
def view_room_json(room):
    try:
        if room == '':
            result_json = {
                'rooms': get_all_rooms_json()
            }
        else:
            result_json = get_room_json(room)
    except IOError:
        abort(404)
    return jsonify(**result_json)


def get_room_json(room):
    title = room.replace('-', ' ').title()
    now = pytz.utc.localize(datetime.utcnow())

    events = get_events(room)
    current_event = get_current_event(events, now)
    timeframe = get_next_available_times(events, now)
    subtext = get_subtext(current_event, timeframe, now)

    return {
        'title': title,
        'url': '/' + room,
        'status': current_event['summary'] if current_event else 'Available',
        'subtext': subtext,
        'images': get_images(room),
    }


def get_current_event(events, now):
    for evt in events:
        start_time = dateutil.parser.parse(evt['start_time'])
        end_time = dateutil.parser.parse(evt['end_time'])
        if now >= start_time and now <= end_time:
            return evt
    return None


def get_subtext(current_event, timeframe, now):
    start_time, end_time = timeframe
    is_available = current_event is not None

    start_time_est = start_time.astimezone(EST)
    end_time_est = end_time.astimezone(EST)

    if is_available:
        if end_time is DATETIME_MAX:
            # It's available indefinitely.
            return ''
        else:
            return 'Until {:%I:%M %p}'.format(end_time_est)
    else:
        if start_time is DATETIME_MIN and end_time is DATETIME_MAX:
            # No events today.
            return ''
        elif start_time is DATETIME_MIN:
            # First event of the day.
            return 'Next available at {:%I:%M %p}'.format(end_time_est)
        elif end_time is DATETIME_MAX:
            # Last event of the day.
            return 'Next available at {:%I:%M %p}'.format(start_time_est)
        else:
            return 'Next available at {:%I:%M %p} to {:%I:%M %p}'.format(start_time_est, end_time_est)


def get_all_rooms_json():
    rooms = [room.replace('.json', '') for room in os.listdir('data')
             if room.endswith('.json')]
    return map(get_room_json, rooms)


def get_events(room):
    events_path = os.path.join('data', room + '.json')
    contents = open(events_path, 'r').read()
    return json.loads(contents)


def get_images(room):
    images_path = os.path.join('static/images/', room)
    if os.path.exists(images_path):
        return [os.path.join(images_path, path)
                for path in os.listdir(images_path)]
    return []


def get_available_times(events):
    yield DATETIME_MIN
    for evt in events:
        yield dateutil.parser.parse(evt['start_time'])
        yield dateutil.parser.parse(evt['end_time'])
    yield DATETIME_MAX


def get_next_available_times(events, now):
    if isinstance(now, basestring):
        now = dateutil.parser.parse(now)

    times = list(get_available_times(events))
    timeframes = zip(times[::2], times[1::2])

    for frame in timeframes:
        start_time, end_time = frame

        if now >= start_time and now < end_time:
            return frame

        if now < start_time:
            return frame


if __name__ == '__main__':
    app.run('0.0.0.0', debug=True)
