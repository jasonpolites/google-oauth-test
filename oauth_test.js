'use strict';

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Generic synchronous sleep function to simulate latency
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// In-memory store for tokens
class MemoryTokenStore {
  constructor(rootRef) {
    this.rootRef = rootRef || "tokens";
    this.tokenStore = {};
    this.tokenStore[this.rootRef] = {};
  }

  async saveTokenSync(tokenKey, tokenValue) {
    // Simulate a slow save
    console.log(`Saving to database...`)
    await sleep(1000);
    this.tokenStore[this.rootRef][tokenKey] = tokenValue;
    console.log(`Saved to database`)
    return tokenValue;
  }

  async loadTokenSync(tokenKey) {
    // Simulate a slow load
    await sleep(1000);    
    return this.tokenStore[this.rootRef][tokenKey];
  }
}

/*************************************
 * Init
 *************************************/
const OAUTH_CALLBACK_ROUTE = 'oauth2callback';
const TOKEN_KEY = 'accessToken';
const TOKEN_STORE = new MemoryTokenStore();

// Load the app secret
const clientSecretJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'client_secret.json')));

let accessToken = undefined;
let oauth2Client = undefined;

/*************************************
 * Middleware for accessToken check
 *************************************/
const tokenChecker = async (req, res, next) => {

  console.log(`In tokenChecker at: ${Date.now()}`)

  if(!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      clientSecretJson.web.client_id,
      clientSecretJson.web.client_secret,
      `http://${req.get('host')}/${OAUTH_CALLBACK_ROUTE}`
    );
  }
  if(!accessToken) {

    accessToken = await TOKEN_STORE.loadTokenSync(TOKEN_KEY);

    // Listen for refresh tokens
    oauth2Client.on('tokens', async (tokens) => {
      console.log(`in oauth2Client.on(...) about to save a token`)
      if (tokens.refresh_token) {
        await TOKEN_STORE.saveTokenSync(TOKEN_KEY, tokens);
      } else {
        console.error(`Expected a refresh_token, but none was found: ${JSON.stringify(tokens, null, 2)}`)
      }
    });

    let max_expiry = Date.now() + 60000;

    if (accessToken && ((accessToken.refresh_token) || (accessToken.expiry_date && accessToken.expiry_date >= max_expiry))) {
      console.log(`Token is not expired or will refresh`)
      await oauth2Client.setCredentials(accessToken);
      next();
    } else {

      // Just for debugging/info
      if(accessToken && accessToken.expiry_date < max_expiry) {
        console.log(`Access Token expired`)
      } else {
        console.log(`No access token found in database`)
      }

      // Generate + redirect to OAuth2 consent form URL
      let redirectUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly'], 
        state: req.path,
        prompt: 'consent'
      });

      console.log(`redirecting to ${redirectUrl}`);
      res.redirect(redirectUrl);
    }
  } else {
    next();
  }
}

/*************************************
 * Web App Start
 *************************************/
const express = require('express');
const app = express();

// The test path will do a token check
app.get('/test', tokenChecker, async (req, res) => {
  try {
    await sleep(100);
    res.status(200).send(`OK`);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get(`/${OAUTH_CALLBACK_ROUTE}`, async (req, res) => {
  try {
    const code = req.query.code;
    const {tokens} = await oauth2Client.getToken(code);

    console.log(`in /${OAUTH_CALLBACK_ROUTE} about to set token credentials`)

    // Setting credentials will trigger the on('tokens') event (?)
    await oauth2Client.setCredentials(tokens);

    res.redirect(req.query.state);
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong; check the logs.');
  }
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log('Oauth Test listening on port', port);
});


