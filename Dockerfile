FROM ubuntu:14.04

RUN apt-get update -y
RUN apt-get install -y \
    python-setuptools \
    nginx

RUN mkdir /src
WORKDIR /src

RUN easy_install pip

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD nginx.conf /etc/nginx/sites-enabled/default
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

ADD calendar/ calendar/

EXPOSE 80
EXPOSE 9001

ADD supervisord.conf .
CMD ["supervisord", "-c", "supervisord.conf"]
