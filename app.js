var http = require('http'),
    fs = require('fs'),
	express = require('express'),
	app = express(),
    path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');

app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

app.listen(process.env.PORT);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post('/index', async (req, res) => {
    // console.log(req.body);
    // // let result = await getFriends(req.body.u);
    // console.log(await deleteData(req.body.u), 'done');
});

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
    process.env.SERVICE_EMAIL,
    null,
    process.env.SERVICE_ID,
    ['https://www.googleapis.com/auth/spreadsheets']);
jwtClient.authorize((err, tokens) => {
    if (err) {
        console.error("JWT VALIDATION ERROR:\n", err);
        return;
    }
});

/*
    returns: [user ids]
*/
async function getUsers() {
    setTimeout(() => { return; }, 1000);
    const req = {
        auth: jwtClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "Sheet1!A1:A1000", // arbitrary choice for 1000
        majorDimension: "COLUMNS"
    };
    try {
        const res = await sheets.spreadsheets.values.get(req);
        return res.data.values[0];
    } catch (err) {
        console.error('GET USER ERROR:\n', err);
    }
}

/*
    parameters:
        user: fb id 
    returns: (int) index if found, -1 otherwise
    reminder: index is 0-based, spreadsheets are 1-based
*/
async function findUser(user) {
    const res = await getUsers();
    return res.findIndex(e => e == user);
}

/*
    parameters:
        user    : fb id
        friends : [fb id]
    returns: n/a
*/
async function updateData(user, friends) {
    const index = await findUser(user) + 1;
    if (index === 0) {
        sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1",
            valueInputOption: "RAW",
            resource: {values: [[user, ...friends]]} // later add back .join at the end, this is just for testing purposes
        }, (err, result) => {
            if (err) console.error('INSERTION ERROR (NEW USER):\n', err);
            return;
        });
    } else {
        sheets.spreadsheets.values.update({
            auth: jwtClient,
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1!A"+index,
            valueInputOption: "RAW",
            resource: {values: [[user, ...friends]]} // ditto
        }, (err, result) => {
            if (err) console.error('INSERTION ERROR (EXISTING USER):\n', err);
            return;
        });
    }
}

async function getFriends(user) {
    // CGY (alphabetical base-26) == 2236 (base 10)
    // the cap for # friends is 5000, but most people will not have that many
    const index = await findUser(user) + 1;
    const req = {
        auth: jwtClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "Sheet1!B"+index+":CGY"+index,
        majorDimension: "ROWS"
    };
    try {
        let res = await sheets.spreadsheets.values.get(req);
        while (typeof res.data.values === 'undefined') res = await sheets.spreadsheets.values.get(req); // bc for some reason fails a lot, but eventually succeeds
        return res.data.values[0];
    } catch (err) {
        console.error('GET FRIENDS ERROR:\n', err);
    }
}

async function removeUserFromFriendsList(user, friends) {
    for (let friend of friends) {
        let row = await findUser(friend); // assumably exists
        let friendFriends = await getFriends(friend);
        let col = friendFriends.findIndex(e => e == user);
        sheets.spreadsheets.batchUpdate({
            auth: jwtClient,
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [
                    {
                        deleteRange: {
                            range: {
                                sheetId: 0,
                                startRowIndex: row,
                                endRowIndex: row+1,
                                startColumnIndex: col+1,
                                endColumnIndex: col+2
                            },
                            shiftDimension: "COLUMNS"
                        }
                    }
                ]
            }
        }, (err, res) => {
            if (err) console.error("REMOVE USER FROM FRIENDS LIST ERROR:\n", err);
            return;
        });
    }
}

async function removeUserFromSheets(user) {
    const index = await findUser(user);
    sheets.spreadsheets.batchUpdate({
        auth: jwtClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        resource: {
            requests: [
                {
                    deleteRange: {
                        range: {
                            sheetId: 0,
                            startRowIndex: index,
                            endRowIndex: index+1,
                            startColumnIndex: 0,
                            endColumnIndex: 5112
                        },
                        shiftDimension: "ROWS"
                    }
                }
            ]
        }
    }, (err, res) => {
        if (err) console.error("REMOVE USER FROM SHEETS ERROR:\n", err);
        return;
    });
}

async function deleteData(user) {
    if (await findUser(user) !== -1) {
        await removeUserFromFriendsList(user, await getFriends(user));
        await removeUserFromSheets(user);
    }
}