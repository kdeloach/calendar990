#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import json
import pytz
import logging
import dateutil.parser
from datetime import datetime

from flask import Flask, render_template, abort, jsonify
from flask.json import JSONEncoder


class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return JSONEncoder.default(self, obj)


app = Flask(__name__)
app.json_encoder = CustomJSONEncoder
app.logger.addHandler(logging.StreamHandler())


DATA_PATH = os.environ['DATA_PATH']


EST = pytz.timezone('US/Eastern')
DATETIME_MIN = datetime.min.replace(tzinfo=pytz.utc)
DATETIME_MAX = datetime.max.replace(tzinfo=pytz.utc)


@app.template_filter('format_time')
def format_time_filter(dt):
    return dt.astimezone(EST).strftime('%-I:%M %p')


@app.template_filter('format_date')
def format_date_filter(dt):
    return dt.astimezone(EST).strftime('%Y-%m-%d %-I:%M %p')


@app.errorhandler(Exception)
def error_handler(ex):
    app.logger.exception(ex)
    return 'Internal Server Error', 500


@app.route('/')
def view_all_rooms():
    now = get_now()
    result_json = get_all_rooms_json(now)
    return render_template('list.html', **result_json)


@app.route('/health')
def health_check():
    return 'OK', 200


@app.route('/.json')
def view_all_rooms_json():
    now = get_now()
    result_json = get_all_rooms_json(now)
    return jsonify(**result_json)


@app.route('/<room>')
def view_room(room):
    now = get_now()
    try:
        result_json = get_room_json(room, now)
    except IOError:
        abort(404)
    return render_template('detail.html', **result_json)


@app.route('/<room>.json')
def view_room_json(room):
    now = get_now()
    try:
        result_json = get_room_json(room, now)
    except IOError:
        abort(404)
    return jsonify(**result_json)


def get_now():
    return pytz.utc.localize(datetime.utcnow())


def get_room_json(room, now):
    title = room.replace('-', ' ').title()

    events = get_events(room)
    events = filter_events(events, now, EST)
    _, current_event, future_events = split_events(events, now)

    return {
        'title': title,
        'url': '/' + room,
        'images': get_images(room),
        'current_event': current_event,
        'future_events': future_events,
        'now_utc': now
    }


def get_all_rooms_json(now):
    if os.path.exists(DATA_PATH):
        rooms = [room.replace('.json', '') for room in os.listdir(DATA_PATH)
                 if room.endswith('.json')]
        rooms = sorted(rooms)
        all_rooms = [get_room_json(room, now) for room in rooms]
    else:
        all_rooms = []
    return {
        'rooms': all_rooms,
        'now_utc': now
    }


def split_events(events, now):
    past_events = []
    future_events = []
    current_event = None

    for evt in events:
        start_time = evt['start_time']
        end_time = evt['end_time']
        if end_time <= now:
            past_events.append(evt)
        elif now >= start_time and now < end_time:
            current_event = evt
        else:
            future_events.append(evt)

    return past_events, current_event, future_events


def get_events(room):
    events_path = os.path.join(DATA_PATH, room + '.json')

    if not os.path.exists(events_path):
        return []

    with open(events_path, 'r') as fp:
        events = json.load(fp)

    # XXX: Mutation
    for evt in events:
        evt['start_time'] = dateutil.parser.parse(evt['start_time'])
        evt['end_time'] = dateutil.parser.parse(evt['end_time'])

    def by_date(evt):
        return (evt['start_time'], evt['end_time'])

    return sorted(events, key=by_date)


def filter_events(events, now, tz):
    """Return events that are happening today only"""
    return [e for e in events
            if e['start_time'].astimezone(tz).day == now.astimezone(tz).day]


def get_images(room):
    images_path = os.path.join('static/images/', room)
    if os.path.exists(images_path):
        return [os.path.join(images_path, path)
                for path in os.listdir(images_path)]
    return []


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
