#!/bin/bash

set -ex

DATA_DIR=data/

./events.py azavea.com_37323531353137392d3335@resource.calendar.google.com \
    > "${DATA_DIR}/chicago.json"

./events.py azavea.com_32313332323030362d333532@resource.calendar.google.com \
    > "${DATA_DIR}/istanbul.json"

./events.py azavea.com_2d3937313336363332343536@resource.calendar.google.com \
    > "${DATA_DIR}/jakarta.json"

./events.py azavea.com_2d33363732373535372d383539@resource.calendar.google.com \
    > "${DATA_DIR}/kiev.json"

./events.py azavea.com_2d3832333338333036313739@resource.calendar.google.com \
    > "${DATA_DIR}/london.json"

./events.py azavea.com_2d3433323639353434333335@resource.calendar.google.com \
    > "${DATA_DIR}/madrid.json"

./events.py azavea.com_2d3531323935383832313738@resource.calendar.google.com \
    > "${DATA_DIR}/mumbai.json"

./events.py azavea.com_2d35373131323734362d383139@resource.calendar.google.com \
    > "${DATA_DIR}/nairobi.json"

./events.py azavea.com_3336343733393238383535@resource.calendar.google.com \
    > "${DATA_DIR}/new-york.json"

./events.py azavea.com_39393439323539323133@resource.calendar.google.com \
    > "${DATA_DIR}/oslo.json"

./events.py azavea.com_2d34343937353334392d353230@resource.calendar.google.com \
    > "${DATA_DIR}/paris.json"

./events.py azavea.com_2d39343638333133382d393132@resource.calendar.google.com \
    > "${DATA_DIR}/saigon.json"

./events.py azavea.com_2d3530363332393734333633@resource.calendar.google.com \
    > "${DATA_DIR}/salta.json"

./events.py azavea.com_2d313034383935352d393134@resource.calendar.google.com \
    > "${DATA_DIR}/shanghai.json"

./events.py azavea.com_2d36333733303039323735@resource.calendar.google.com \
    > "${DATA_DIR}/springfield.json"

./events.py azavea.com_2d3938333739393434383537@resource.calendar.google.com \
    > "${DATA_DIR}/stockholm.json"

./events.py azavea.com_39383537323133383131@resource.calendar.google.com \
    > "${DATA_DIR}/sydney.json"

./events.py azavea.com_3732333135313339353335@resource.calendar.google.com \
    > "${DATA_DIR}/tokyo.json"

./events.py azavea.com_323532323135382d383738@resource.calendar.google.com \
    > "${DATA_DIR}/toronto.json"
