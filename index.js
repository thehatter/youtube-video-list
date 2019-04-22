const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const secrets = require('./secrets.json');
const pug = require('pug');


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getVideos);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files from playlist.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// @todo add function to get uploads playlist id from chanel
// and save it to local config file! No hardocde! 

function getVideos(auth) {
  var service = google.youtube('v3');
  service.playlistItems.list({
    auth: auth,
    maxResults: 10,
    part: 'snippet,contentDetails',
    playlistId: 'PL9DYy-8BkbX5_ehcLP61a5pSGLWjKSx9b'
    // gorod all videos playlist id is UUsvrWrIu_1ws5vC17h4EzeA
    // playlist new id 8BkbX5_ehcLP61a5pSGLWjKSx9b
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var videos = response.items;
    if (videos.length == 0) {
      console.log('No video found.');
    } else {
      saveTemplate(videos);
    }
  });
}

/**
 * Lists the names and IDs of up to 10 files chanell.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// serch function NOT return all uploads from chenel! mb bug or something
//function getVideos(auth) {
  //var service = google.youtube('v3');
  //service.search.list({
    //auth: auth,
    //channelId: secrets.chanel_id,
    //maxResults: 10,
    //part: 'snippet',
    //order: 'date'
  //}, function(err, response) {
    //if (err) {
      //console.log('The API returned an error: ' + err);
      //return;
    //}
    //var videos = response.items;
    //if (videos.length == 0) {
      //console.log('No video found.');
    //} else {
      ////console.log(videos);
      ////videos.forEach(function(video) {
        ////console.log(video.snippet.title );
      ////});
      //saveTemplate(videos);
    //}
  //});
//}

// @add notifications and log
function saveTemplate(videos) {
  videos.map(function(video) {
    console.log(video);
  });
  saveHTMLfile(renderTemplate(videos, 'template.pug'), 'youtube_vidget.html' );
  saveHTMLfile(renderTemplate(videos, 'template_2.pug'), 'youtube_vidget_2.html' );
}


function renderTemplate(videos, templateName) {
  // Compile template.pug, and render a set of data
  return (pug.renderFile(templateName, {
    videos: videos
  }));
}

function saveHTMLfile(fileBody, fileName) {
  fs.writeFile(fileName, fileBody, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}
