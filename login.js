// import * as d from "./data.js" // removed bc bs stuff who cares

function testAPI() {                      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
    console.log('Welcome!  Fetching your information.... ');
    FB.api(
        '/me',
        'GET',
        {"fields":"id,name,first_name,last_name,friends{hometown,short_name},hometown"},
        function(response) {
            console.log(response);
        }
    );
}

function checkLoginState() {               // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
        statusChangeCallback(response);
    });
}

function statusChangeCallback(response) {  // Called with the results from FB.getLoginStatus().
    console.log('statusChangeCallback');
    console.log(response);                   // The current login status of the person.
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        testAPI();  
    } else {                                 // Not logged into your webpage or we are unable to tell.
    document.getElementById('status').innerHTML = 'Please log into this webpage.';
    }
}

window.fbAsyncInit = function() {
    FB.init({
    appId      : '201530738067216',
    xfbml      : true,
    version    : 'v11.0'
    });

    FB.AppEvents.logPageView();
    
    FB.getLoginStatus(function(response) {   // Called after the JS SDK has been initialized.
        statusChangeCallback(response);        // Returns the login status.
    });
};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

const test = () => {
    let u = document.getElementById("u").value;
    let f = document.getElementById("f").value;
    insertData(u,f);
}
document.querySelector('button#test').addEventListener('click', test);

// EVERYTHING BELOW IS FROM "./data.js".
// The reason why it's here is state on line 1.

const { google } = require('googleapis');
const sheets = google.sheets('v4');

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
    process.env.SERVICE_EMAIL,
    null,
    process.env.SERVICE_ID,
    ['https://www.googleapis.com/auth/spreadsheets']);

// returns: [user ids]
const getUsers = () => {
    jwtClient.authorize((err, tokens) => {
        if (err) {
            console.log(err);
            return;
        }
        else {
            sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: "Sheet1!A1:A1000", // arbitrary choice for 1000
                majorDimension: "COLUMNS"
            },
            (err, result) => {
                if (err) { console.log(err); return; }
                else return result.values; // returns array of strings of users
            })
        }
    })
}

// parameters:
//   user: fb id 
// returns: (int) index if found, -1 otherwise
// reminder: index is 0-based, spreadsheets are 1-based
const findUser = (user) => {
    return getUsers().findIndex(e => e == user);
}

// parameters:
//   user    : fb id
//   friends : [fb id]
// returns: n/a
const insertData = (user, friends) => {
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            let index = findUser(user);
            if (index === -1) {
                sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SPREADSHEET_ID,
                    range: "Sheet1",
                    valueInputOption: "RAW",
                    resource: {values: [user, friends]} // later add back .join at the end, this is just for testing purposes
                }, (err, result) => {
                    if (err) console.log(err);
                    return;
                });
            } else {
                sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.SPREADSHEET_ID,
                    range: "Sheet1!A"+index,
                    valueInputOption: "RAW",
                    resource: {values: [user, friends]} // ditto
                }, (err, result) => {
                    if (err) console.log(err);
                    return;
                });
            }
        }
    });
}