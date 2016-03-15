#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import unittest

from datetime import datetime

from server import get_next_available_time, get_subtext


class TestCase1(unittest.TestCase):
    def test_timeframes(self):
        events = [
            {'start_time': '2016-03-01 10:00', 'end_time': '2016-03-01 11:00'},
            {'start_time': '2016-03-01 13:00', 'end_time': '2016-03-01 14:00'},
            {'start_time': '2016-03-01 16:00', 'end_time': '2016-03-01 18:00'},
        ]
        get_next_available_time('2016-03-01 16:01', events)

        events = [
            {'start_time': '2016-03-01 11:00', 'end_time': '2016-03-01 12:00'},
        ]
        frame = get_next_available_time('2016-03-01 13:00', events)
        subtext = get_subtext('2016-03-01 13:00', events[0], frame)
        print(subtext)



if __name__ == '__main__':
    unittest.main()
