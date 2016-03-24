# calendar

This application aggregates Google Calendar data for all of the conference
rooms at Azavea for display on Android tablets next to each room.

## Deployments

This assumes you have the `eb` CLI installed, see [Getting Set Up with EB Command Line Interface](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-getting-set-up.html).

Run these commands to launch the application for the first time:

```
eb init -p Docker
eb create calendar-app
```

TODO: Instructions for modifying the default region and EC2 keypairs

Run this to command to update an existing deployment:

```
eb deploy
```

### Deploy with credentials

You'll need to generate oauth2 credentials before the application
can consume the Google Calendar API. The client secrets and authentication
credentials both need to be deployed with the Docker image for everything
to work correctly.

1. Download credentials and save them to `client_secrets.json`.
This file can be obtained from the [Google API Credentials](https://console.developers.google.com/project/_/apiui/credential) website.

2. Authenticate oauth2 credentials with the following steps:

    ```bash
    ./scripts/run-interactive.sh
    cd calendar990
    ./make_credentials.py --noauth_local_webserver
    ```

3. This should produce a file called `credentials.json`.

4. Stage these files, but do not commit them.

    ```bash
    git add -f client_secrets.json
    git add -f credentials.json
    ```

5. Run `eb deploy --staged`

## Credit

https://github.com/danriti/nginx-gunicorn-flask
