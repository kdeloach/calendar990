# calendar990

This dashboard uses the [Google Calendar API](https://developers.google.com/google-apps/calendar/)
to display the current status of all conference rooms at [Azavea](http://www.azavea.com).

## Requirements

* Docker
* Docker Compose

## Setup

```
cp sample.env .env
vim .env # Populate with actual values
./scripts/update.sh
./scripts/server.sh
```

## Deploy

```
./scripts/publish.sh
```
