#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import json

from flask import Flask, render_template, abort, url_for


app = Flask(__name__)


@app.route('/')
def hello():
    return render_template('index.html')


@app.route('/<room>')
def view_room(room):
    room_title = room.replace('-', ' ').title()

    events_path = os.path.join('data', room + '.json')
    try:
        events = open(events_path, 'r').read()
    except IOError:
        abort(404)

    images = json.dumps(get_room_images(room))

    return render_template('room.html',
                           room_title=room_title,
                           events=events,
                           images=images)


def get_room_images(room):
    images_path = 'static/images/' + room
    if os.path.exists(images_path):
        return [images_path + '/' + path
                for path in os.listdir(images_path)]
    return []


if __name__ == '__main__':
    app.run('0.0.0.0', debug=True)
