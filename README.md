# calendar990

This dashboard uses the [Google Calendar API](https://developers.google.com/google-apps/calendar/)
to display the current status of all conference rooms at [Azavea](http://www.azavea.com).

## Requirements

* Docker
* Docker Compose

## Setup

```
./scripts/update.sh
./scripts/server.sh
```

## Deploy

Setup the environment variables required by the deployment scripts.

```
cp sample.env .env
vim .env # Populate with actual values
```

Then upload to S3.

```
./scripts/publish.sh
```
