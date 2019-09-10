// Import express and request modules
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var http = require("http");
var promise = require("promise");

// Simple ODataServer variables
var http = require("http");
var Datastore = require("nedb");
var db = new Datastore({ inMemoryOnly: true });
var ODataServer = require("simple-odata-server");
var Adapter = require("simple-odata-server-nedb");

// Instantiates Express and assigns our app variable to it
var app = express();

// initialization of body-parser to parse req parameters
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

// Again, we define a port we want to listen to
const PORT = 4390;

// oData data model for odata server setup

var model = {
  namespace: "splashOData",
  entityTypes: {
    EventType: {
      _id: { type: "Edm.String", key: true },
      event_owner_first_name: { type: "Edm.String" },
      event_owner_last_name: { type: "Edm.String" },
      title: { type: "Edm.String" },
      description: { type: "Edm.String" },
      description_text: { type: "Edm.String" },
      event_start: { type: "Edm:DateTime" },
      event_end: { type: "Edm:DateTime" },
      venue_name: { type: "Edm.String" },
      address: { type: "Edm.String" },
      city: { type: "Edm.String" },
      state: { type: "Edm.String" },
      zip_code: { type: "Edm.String" },
      country: { type: "Edm.String" },
      domain: { type: "Edm.String" },
      paid_for_domain: { type: "Edm.String" },
      custom_domain: { type: "Edm.String" },
      fq_url: { type: "Edm.String" },
      mobile_check_in_url: { type: "Edm.String" },
      event_owner_email: { type: "Edm.String" }
    }
  },
  entitySets: {
    events: {
      entityType: "splashOData.EventType"
    }
  }
};

var odataServer = ODataServer("http://localhost:" + PORT)
  .model(model)
  .adapter(
    Adapter(function(es, cb) {
      cb(null, db);
    })
  );

function load_odata_cache() {
  return new Promise(function(resolve, reject) {
    for (var i = 0; i < splash_events.length; i++) {
      db.insert({
        _id: splash_events[i].id,
        event_owner_email: splash_events[i].event_owner_email,
        event_owner_first_name: splash_events[i].event_owner_first_name,
        event_owner_last_name: splash_events[i].event_owner_last_name,
        title: splash_events[i].title,
        description: splash_events[i].description,
        description_text: splash_events[i].description_text,
        event_start: splash_events[i].event_start,
        event_end: splash_events[i].event_end,
        venue_name: splash_events[i].venue_name,
        address: splash_events[i].address,
        city: splash_events[i].city,
        state: splash_events[i].state,
        zip_code: splash_events[i].zip_code,
        country: splash_events[i].country,
        domain: splash_events[i].domain,
        paid_for_domain: splash_events[i].paid_for_domain,
        custom_domain: splash_events[i].custom_domain,
        fq_url: splash_events[i].fq_url,
        mobile_check_in_url: splash_events[i].mobile_check_in_url
      });
    }
    console.log("OData cache loaded");
  });
}

/// splash constants hardcoded
/// change later

const splash_client_id = "";
const splash_client_secret = "";
const splash_api_url = "https://prod-api.splashthat.com";
const splash_email = "sxleung@gmail.com";
const splash_password = "";

//using globals to save time

var splash_refresh_token = "";
var splash_access_token = "";
var splash_events;
var splash_event_guests;
var slack_resp_url;

// splash functions
function initialize_splash() {
  return new Promise(function(resolve, reject) {
    request(
      {
        url: splash_api_url + "/oauth/v2/token", //URL to hit
        qs: {
          client_id: splash_client_id,
          client_secret: splash_client_secret,
          grant_type: "password",
          scope: "user",
          username: splash_email,
          password: splash_password
        }, //Query string data
        method: "GET", //Specify the method
        json: true
      },
      (err, res, body) => {
        if (err) {
          console.log("Error occurred with initialize_splash");
          console.log(err);
          reject(err);
        } else {
          splash_access_token = body.access_token;
          splash_refresh_token = body.refresh_token;
          console.log("Connected to Splash!");
          // console.log("access_token: " + splash_access_token);
          resolve(splash_access_token);
        }
      }
    );
  });
}

function get_splash_events() {
  return new Promise(function(resolve, reject) {
    request(
      {
        url: splash_api_url + "/events?limit=50&viewGroups[]=splashHubList", //URL to hit
        auth: { bearer: splash_access_token },
        method: "GET", //Specify the method
        json: true
      },
      (err, res, body) => {
        if (err) {
          console.log("Error occurred with get_splash_events");
          console.log(err);
          reject(err);
        } else {
          console.log("Retrieved events from splash");
          splash_events = body.data;
          // console.log(splash_events);
          resolve(splash_events);
        }
      }
    );
  });
}

/// splash functions

async function load_splash() {
  const init = await initialize_splash();
  const get = await get_splash_events();
  const load = await load_odata_cache();
}

function main() {
  load_splash();
  http.createServer(odataServer.handle.bind(odataServer)).listen(PORT);
  console.log("oData server listening on http://localhost:" + PORT);
}

main();
