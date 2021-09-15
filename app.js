const express = require('express');
const app = express();
const path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');

class OFFSET {
    static NAME = { NUM: 1, LETTER: 'B' };
    static HOMETOWN = { NUM: 2, LETTER: 'C' };
    static FRIENDS = { NUM: 3, LETTER: 'D' };
}

app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

app.listen(process.env.PORT);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post('/fb-login', async (req, res) => {
    await updateData(req.body.id, req.body.name, req.body.hometown.name, req.body.friends.data.map(e => e.id));
});

app.post('/user-deletion', async (req, res) => {
    await deleteData(req.body.id);
})

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
    returns: [fb ids]
*/
async function getUsers() {
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
async function findUser(id) {
    const res = await getUsers();
    return res.findIndex(e => e == id);
}

/*
    parameters:
        user    : fb id
        friends : [fb id]
    returns: n/a
*/
async function updateData(id, name, hometown, friends) {
    const index = await findUser(id) + 1;
    if (index === 0) {
        sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1",
            valueInputOption: "RAW",
            resource: {values: [[id, name, hometown, ...friends]]}
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
            resource: {values: [[id, name, hometown, ...friends]]} // ditto
        }, (err, result) => {
            if (err) console.error('INSERTION ERROR (EXISTING USER):\n', err);
            return;
        });
    }
}

async function getFriends(id) {
    // CGY (alphabetical base-26) == 2236 (base 10)
    // the cap for # friends is 5000, but most people will not have that many
    const index = await findUser(id) + 1;
    const req = {
        auth: jwtClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "Sheet1!"+OFFSET.FRIENDS.LETTER+index+":CGY"+index,
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

async function removeUserFromFriendsList(id, friends) {
    for (let friendId of friends) {
        let row = await findUser(friendId); // assumably exists
        let friendFriends = await getFriends(friendId);
        let col = friendFriends.findIndex(e => e == id);
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
                                startColumnIndex: col+OFFSET.FRIENDS.NUM,
                                endColumnIndex: col+OFFSET.FRIENDS.NUM+1
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

async function removeUserFromSheets(id) {
    const index = await findUser(id);
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

async function deleteData(id) {
    if (await findUser(id) !== -1) {
        await removeUserFromFriendsList(id, await getFriends(id));
        await removeUserFromSheets(id);
    }
}