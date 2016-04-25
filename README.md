# calendar990

This application aggregates Google Calendar data for all of the conference
rooms at [Azavea](http://www.azavea.com) for display on Android tablets next to each room.

## Setup

Required environmental variables:

| Name | Description |
| --- | --- |
| `CAL990_BUCKET` | Name of S3 bucket to deploy `www/` folder to (Ex. `calendar990`) |
| `CAL990_AWS_ACCESS_KEY_ID` | N/A |
| `CAL990_AWS_SECRET_ACCESS_KEY` | N/A |

Get things started with:

```
vagrant up
```

Download the latest calendar events with:

```
vagrant ssh -c '/vagrant/scripts/collect.sh'
```

Run the development web server with:

```
./scripts/run.sh
```

## Deploy

Upload contents of `www/` folder to `CAL990_BUCKET` with:

```
vagrant ssh -c '/vagrant/scripts/publish.sh'
```
