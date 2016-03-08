#!/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import os
import string

from flask import Flask, render_template, abort


app = Flask(__name__)


@app.route('/')
def hello():
    return render_template('index.html')


@app.route('/<room>')
def view_room(room):
    room_name = room.replace('-', ' ').title()

    events_path = os.path.join('data', room + '.json') 
    try:
        events = open(events_path, 'r').read()
    except IOError:
        abort(404)

    return render_template('room.html',
        room_name=room_name, events=events)


if __name__ == '__main__':
    app.run(debug=True)
