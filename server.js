// server.js
var express = require('express');
var bodyParser = require('body-parser');
var Request = require('request');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

// Use this helper method to send the datapoint back to Akrasia once you've got it
var AKRASIA_BASE_URL = 'https://akr.asia'
var akrasiaCallback = function(session, result) {
  Request.post({
    url: AKRASIA_BASE_URL + '/integrations/callback',
    body: {
      'session': session,
      'result': result // valid keys: value, timestamp, daystamp, comment, requestid
    },
    json: true
  })
};

app.post("/fetch", function(request, response) {
  console.log('Fetch called.');
  // Get the session and user options from Akrasia's request
  var callbackSession = request.body.session;
  var userOptions = request.body.user_options;
  
  response.send({'result': 'started'});
  
  // Get the user's forum name (set and stored through Akrasia) from the passed options
  var username = userOptions.codewars_username;
  
  // Get the user's profile from the forum API, grab the post count, and submit the datapoint to Akrasia
  Request('https://www.codewars.com/api/v1/users/' +  username, function(err, res, body) {
    var userData = JSON.parse(body);
    
    var count = userData.codeChallenges.totalCompleted;
    
    // Create the datapoint with value (and optional comment)
    var result = {
      value: count,
      comment: 'via Akrasia integration: Codewars Completed Code Challenges'
    };
    
    // Send the datapoint to Akrasia
    akrasiaCallback(callbackSession, result);
    
    // Not necessary, but helps you debug in Glitch!
    console.log(result);
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
