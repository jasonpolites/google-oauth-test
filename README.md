# Google OAuth Test
This sample app follows the guidance from the [google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client).

## Setup
This sample requires a `client_secret.json` file to be present in the root of the sample folder. You create this file by following the guidelines [here] (https://developers.google.com/identity/protocols/OpenIDConnect)

When creating your OAuth 2.0 credentials, you will need to specify a redirect URL. If you're running this sample locally, just use `http://localhost:8080/oauth2callback` as the value for this.

Make sure you run `npm install` to load the dependencies

## Running the Sample
To run the sample, just do:

```
npm start
```

You should see this message in the console

```
Oauth Test listening on port 8080
```

Then just open your browser to [http://localhost:8080/](http://localhost:8080/)

## The Problem
There is a race condition which presents when tokens are stored in a system with asymmetric read vs write latency (that is, when writes take longer than reads). This results in a *double loop* of the OAuth flow, as well as a *double write* of the access tokens (actually for some reason I get three writes, not sure why).

The logs observed at execution time are:

```
Loading Client Secret...
Client Secret Loaded.
Oauth Test listening on port 8080
Checking auth token...
Creating new oauth2Client...
No access token in scope, attempting to load...
No access token found in database, redirecting to oauth flow
in oauth2Client.on(...) about to save a token
Saving to database...
in /oauth2callback about to set token credentials
Checking auth token...
No access token in scope, attempting to load...
No access token found in database, redirecting to oauth flow
Saved to database
in oauth2Client.on(...) about to save a token
Saving to database...
in oauth2Client.on(...) about to save a token
Saving to database...
in /oauth2callback about to set token credentials
Checking auth token...
No access token in scope, attempting to load...
Token is not expired or will refresh
Saved to database
Saved to database
```