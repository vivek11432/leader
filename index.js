// Import express and request modules
var express = require('express');
var request = require('request');
var bodyParser = require("body-parser");
var signature = require("./verifySignature");
const appHome = require("./appHome");
const dotenv = require('dotenv');
dotenv.config();
// Store our app's ID and Secret. These we got from Step 1.
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables.
var clientId = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;

// Instantiates Express and assigns our app variable to it
var app = express();

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));


// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
  res.send('Ngrok is working! Path Hit: ' + req.url);
});

app.post("/slack/actions", async (req, res) => {
  const { token, trigger_id, user, actions, type } = JSON.parse(req.body.payload);
  if (actions && actions[0].action_id.match(/create_task/)) {
    appHome.openCreateTaskModal(trigger_id);
  }
});

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500);
    res.send({"Error": "Looks like we're not getting code."});
    console.log("Looks like we're not getting code.");
  } else {
    // If it's there...
    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    request({
      url: 'https://slack.com/api/oauth.v2.access', //URL to hit
      qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
      method: 'GET', //Specify the method

    }, function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.json(body);

      }
    })
  }
});

app.post("/slack/events", async (req, res) => {

  switch (req.body && req.body.type) {
    case "url_verification": {
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }

    case "event_callback": {
      // Verify the signing secret
      if (!signature.isVerified(req)) {
        res.sendStatus(404);
        return;
      }

      // Request is verified --
      else {
        const { type, user, channel, tab, text, subtype } = req.body.event;
        // Triggered when the App Home is opened by a user
        if (type === "app_home_opened") {
          // Display App Home
          appHome.displayHome(user);
        }

        /* 
         * If you want to allow user to create a note from DM, uncomment the part! 

        // Triggered when the bot gets a DM
        else if(type === 'message') {
          
          if(subtype !== 'bot_message') { 
            
            // Create a note from the text with a default color
            const timestamp = new Date();
            const data = {
              timestamp: timestamp,
              note: text,
              color: 'yellow'
            }
            await appHome.displayHome(user, data);
                                         
            // DM back to the user 
            message.send(channel, text);
          }
        }
        */
      }
      break;
    }
    default: {
      res.sendStatus(404);
    }
  }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/command', function(req, res) {
  res.send('Your ngrok tunnel is up and running!');
});


// Again, we define a port we want to listen to
const PORT=4390;

// Lets start our server
app.listen(PORT, function () {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Example app listening on port " + PORT);
});