FROM python:3.6-slim

MAINTAINER kdeloach@azavea.com

RUN apt-get update && apt-get install -y \
    # For AWS CLI
    groff less \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt

WORKDIR /usr/src/
