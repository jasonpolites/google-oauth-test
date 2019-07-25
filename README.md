# Google OAuth Test
This sample app follows the guidance from the [google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client).

## Setup
This sample requires a `client_secret.json` file to be present in the root of the sample folder. You create this file by following the guidelines [here] (https://developers.google.com/identity/protocols/OpenIDConnect)

When creating your OAuth 2.0 credentials, you will need to specify a redirect URL. If you're running this sample locally, just use `http://localhost:8080/oauth2callback` as the value for the this.

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