#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division

import unittest

from datetime import datetime

import pytz
import dateutil.parser

from server import (get_next_available_times, get_subtext,
                    DATETIME_MIN, DATETIME_MAX)


def parse(date_string):
    return dateutil.parser.parse(date_string)


class TestCase1(unittest.TestCase):
    def test_available_times(self):
        events = [
            {'start_time': '2016-03-01 10:00+0', 'end_time': '2016-03-01 11:00+0'},
            {'start_time': '2016-03-01 13:00+0', 'end_time': '2016-03-01 14:00+0'},
            {'start_time': '2016-03-01 16:00+0', 'end_time': '2016-03-01 18:00+0'},
        ]

        test = lambda now: get_next_available_times(events, now)

        self.assertEqual(test('2016-03-01 09:00+0')[0], DATETIME_MIN)
        self.assertEqual(test('2016-03-01 09:00+0')[1], parse('2016-03-01 10:00+0'))
        self.assertEqual(test('2016-03-01 09:59+0')[0], DATETIME_MIN)
        self.assertEqual(test('2016-03-01 09:59+0')[1], parse('2016-03-01 10:00+0'))

        self.assertEqual(test('2016-03-01 10:00+0')[0], parse('2016-03-01 11:00+0'))
        self.assertEqual(test('2016-03-01 10:00+0')[1], parse('2016-03-01 13:00+0'))
        self.assertEqual(test('2016-03-01 10:59+0')[0], parse('2016-03-01 11:00+0'))
        self.assertEqual(test('2016-03-01 10:59+0')[1], parse('2016-03-01 13:00+0'))

        self.assertEqual(test('2016-03-01 11:00+0')[0], parse('2016-03-01 11:00+0'))
        self.assertEqual(test('2016-03-01 11:00+0')[1], parse('2016-03-01 13:00+0'))
        self.assertEqual(test('2016-03-01 12:59+0')[0], parse('2016-03-01 11:00+0'))
        self.assertEqual(test('2016-03-01 12:59+0')[1], parse('2016-03-01 13:00+0'))

        self.assertEqual(test('2016-03-01 19:00+0')[0], parse('2016-03-01 18:00+0'))
        self.assertEqual(test('2016-03-01 19:00+0')[1], DATETIME_MAX)

    def test_subtext(self):
        events = [
            {'start_time': '2016-03-01 11:00+0', 'end_time': '2016-03-01 12:00+0'},
        ]
        frame = get_next_available_times(events, '2016-03-01 13:00+0')
        subtext = get_subtext(events[0], frame, '2016-03-01 13:00+0')
        print(subtext)


if __name__ == '__main__':
    unittest.main()
