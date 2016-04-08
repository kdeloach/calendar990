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

RUN mkdir /src/data
ENV DATA_PATH /src/data

ADD nginx.conf /etc/nginx/sites-enabled/default
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

ADD crontab /etc/cron.d/collect-events
RUN chmod 0644 /etc/cron.d/collect-events
RUN touch /var/log/cron.log

ENV SECRETS_PATH=/src/secrets
ADD client_secrets.json /src/secrets/
ADD credentials.json /src/secrets/

ADD calendar990/ calendar990/

EXPOSE 80

ADD supervisord.conf .
CMD ["supervisord", "-c", "supervisord.conf"]
