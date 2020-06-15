// Import express and request modules
var express = require('express');
var request = require('request');
var bodyParser = require("body-parser");
var signature = require("./verifySignature");
const appHome = require("./appHome");
const dotenv = require('dotenv');
const mysql = require('mysql');
dotenv.config();
// Store our app's ID and Secret. These we got from Step 1.
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables.
var clientId = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;

const con = mysql.createConnection({  
  host: "localhost",
  user: "root",  
  password: "",
  database: "leader"
});

const createDBTables = function(){
  let createTodos = `create table if not exists leads(
    id int primary key auto_increment,
    customer_name varchar(255) not null,
    lead_description varchar(255) not null,
    mechanic_name varchar(255) not null,
    mechanic_slack_id varchar(255) not null,
    created_by_name varchar(255) not null,
    created_by_slack_id varchar(255) not null,
    status varchar(255) not null,
    appointment_date varchar(255) not null,
    created_at varchar(255) not null
  )`;
  con.query(createTodos, function(err, results, fields) {
    if (err) {
      console.log(err.message);
    }else{
      console.log("Table Created");
    }
  });
}

con.connect(function(err) {
  if (err){
    con.query("CREATE DATABASE leader", function (err, result) {  
      if (err){
        throw err;  
      }else{
        createDBTables();
        console.log("Database created");  
      }
    });  
    throw err;  
  }else{
    // createDBTables();
    console.log("Connected!");  
  }
});   

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
  const { token, trigger_id, user, actions, type, view } = JSON.parse(req.body.payload);
  if (actions && actions[0].action_id.match(/create_task/)) {
    appHome.openCreateTaskModal(trigger_id);
  }
  else if(type === 'view_submission') {
    res.send(''); // Make sure to respond to the server to avoid an error
    var ts = new Date();
    console.log("Insert Running");
    var mechanic = view.state.values.mechanic.mechanic_id.selected_option;
    const data = {
      timestamp: ts,
      customerName: view.state.values.customer_name.customer_name_id.value,
      leadDate: view.state.values.lead_date.lead_date_val.selected_date,
      leadDecription: view.state.values.lead_description.lead_description_id.value,
      mechanicId: mechanic.value,
      mechanicName: mechanic.text.text,
      creatorName: user.name,
      creatorId: user.id,
      status: "new"
    }
    let insertLeadQuery = `INSERT INTO leads(customer_name, lead_description, mechanic_name, mechanic_slack_id, created_by_name, created_by_slack_id, status, appointment_date, created_at)
           VALUES('${data.customerName}', '${data.leadDecription}', '${data.mechanicName}', '${data.mechanicId}', '${data.creatorName}', '${data.creatorId}', '${data.status}', '${data.leadDate}', '${data.timestamp}')`;

    con.query(insertLeadQuery, function(err, results, fields) {
      if (err) {
        appHome.displayHome(user.id);
        console.log(err.message);
      }else{
        var getLeadsQuery = 'Select * from leads ORDER BY id DESC;'
        con.query(getLeadsQuery, function(err, results, fields) {
          if (err) {
            console.log("Fetch Lead Error");
          }else{
            appHome.displayHome(user.id, results);
          }
        });
        console.log("Table Created");
      }
    });
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
          var getLeadsQuery = 'Select * from leads ORDER BY id DESC;'
          con.query(getLeadsQuery, function(err, results, fields) {
            if (err) {
              console.log("Fetch Lead Query Error");
            }else{
              // console.log(fields);
              // console.log(results);
              appHome.displayHome(user, results);
            }
          });
          // appHome.displayHome(user);
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