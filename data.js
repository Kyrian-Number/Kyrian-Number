const { google } = require('googleapis');
const sheets = google.sheets('v4');

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
    process.env.SERVICE_EMAIL,
    null,
    process.env.SERVICE_ID,
    ['https://www.googleapis.com/auth/spreadsheets']);

// returns: [user ids]
export const getUsers = () => {
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
export const findUser = (user) => {
    return getUsers().findIndex(e => e == user);
}

// parameters:
//   user    : fb id
//   friends : [fb id]
// returns: n/a
export const insertData = (user, friends) => {
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