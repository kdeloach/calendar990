FROM python:3.6-slim

MAINTAINER kdeloach@gmail.com

WORKDIR /usr/src/

RUN apt-get update && apt-get install -y \
    # For AWS CLI
    groff less

RUN rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt
