# calendar

This application aggregates Google Calendar data for all of the conference
rooms at Azavea for display on Android tablets next to each room.

## Deployments

This assumes you have the `eb` CLI installed, see [Getting Set Up with EB Command Line Interface](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-getting-set-up.html).

Run these commands to launch the application for the first time:

```
eb init -p Docker
eb create calendar-app
eb open
```

Run this to command to update an existing deployment:

```
eb deploy
```

## Credit

https://github.com/danriti/nginx-gunicorn-flask
