var http = require('http'),
    fs = require('fs'),
	express = require('express'),
	app = express(),
    path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');

app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

app.listen(3000);

app.get("/", (req, res) => {
    console.log('test');
    res.sendFile(__dirname + "/index.html");
});

app.post('/index', async (req, res) => {
    console.log(req.body);
    const response = await getUsers();
    console.log(response);
});

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
    "friend@kyrian-number.iam.gserviceaccount.com",
    null,
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLT19nXW5XV9Mp\nXgC/p5xcpFrTNz8PvwQzKlPSaZZYo6zH7SB22gzvunKPhh3NVOCPISpuvRrWAs3J\ntELml/imvPfaGFfb3VkOPb2xR/btO90UfA0t2dF4t4CUzgwKEVAtkYsC2kxQCp1e\nmg0IlGmj5+FAghOnWvVfQljqStPlTPSlZ7AKTB9hRQZCZj1mzQ3fJ+vfKrNCpHfL\nPpSbw68iFgl6eQhsO6lOPBP56qGa+opSLUqlXGPqvcDBrB6j++kxSW5SUw5M3u4v\nVDtsU9USzZdS/D/crXOIH2yV55vGlYxGYBSW24//4Z/mB6AmfvhMdKOSR0gmR4xM\nrRz9Fbl9AgMBAAECggEAAWicafFMORWDuvRPfCDnF9kUj7jkfeyfZ7czNqmOZgF9\nfnUe4aW093YGD4vFTYjTPJesTv+E3dvEcrnDrOY5P7RsznSziYGzslUecDuQvwH3\nxD3mm0DLZK0+b5CdUEunmTnR9vhHyXKhFWPmOXDYeCk3uSH0svqDisiIYVOigiLc\n1JMvxZMX+ZkGn8rRK6lQQ+5YCOVxmfBsSqOiLlOVnBdPzGRfscOzWX4YSDk7sB7L\n91veFDwrLOx5giSgFq59zltF9FHAl/CzBLDFsRykRuf+FZrUv/91RKz1m9LLXz46\nfxUweH9qHYrb2WrEUGe4bQO8XsJ1uhAO6MAqtgq50QKBgQDkWBOcoprL+yPKd0NN\nHG/8DI48M0VqdCXcaKlmv++6h59/XYKWBoymHTcN1hhswSDh+RRgw1sm7BCTTJw7\nNZHv98rQoimgl0kJj0PRtkUY8OrCKbr0IoPkLhaPsUW/Y9hU2lTHIGypyJ7QyYjS\n4fPhQIQL+rmf/4Yi591uuYyDGwKBgQDj7xqqp6Ss4W5eKV+zwifoBwCF66A43g7Y\n+DdA92XS4C/bdxI2I/UhAUPV5H26+obrn0R0OUXPNqrjO3sLPsVS87p+g07VaQRl\nuJIzsebyQo8VqN0+RZzxqsyGFppL0630B+jO+batIX8p6b3OEZMOso/XwE3nldZ/\nEk9GM3DnRwKBgQCigpSim48zsS7Nv4dkb+K7LWxlJ9A1bSgs70fw2pUQ2ckH6lMv\n1sVuy8gMztxfOive51g7bY2H6+X4D0P5V6zfbiknxuF9a24NoaqQq/oNQBizyuNF\nMPNRCAQCjBWpmrOx4BkKBuePBjsROP1pqGnbXAEeTXiiiEa8vOv5C5EXFQKBgDoI\ncLOuh0D1DJKw2gr8jgiHb9ypB1wzPXiEihziYGx2Y/jushZSxWCn38ufp1tp2dw3\n6sfkpR+C/bNpO4S7cKYUJBF+AR5Y5KO5gI/k5bYcuC19lwb51mG5aOVi79oKhSmy\nsdWwwpAGDUhwmMDUvKprUDBQaAVkov4rfT+UbVSVAoGBALKy5dKmfCdeg3waKDgw\ncQSqb7zvpCPzrF8IDmV+PpHDLBInC+oIex2J3E7ZCgVs2u4bOr10LlXU0SFCe8wg\nkeaT6+/r/nZynTmsQAEIOSv8PdV0QmJuf3bCLrNBnkCKQuxxCdw/CF/Hgp0ga2Mv\nprGMkohVTafJ4mNNQDevo5Aj\n-----END PRIVATE KEY-----\n",
    ['https://www.googleapis.com/auth/spreadsheets']);
jwtClient.authorize((err, tokens) => {
    if (err) {
        console.log("JWT VALIDATION ERROR:\n", err);
        return;
    }
});

// returns: [user ids]
async function getUsers() {
    const request = {
        auth: jwtClient,
        spreadsheetId: "1zPb-lWbmgpKN996pcDyKXExCvJynCbJ6P1k0vtsxzE8",
        range: "Sheet1!A1:A1000", // arbitrary choice for 1000
        majorDimension: "COLUMNS"
    };
    try {
        const response = await sheets.spreadsheets.values.get(request);
        return response.data.values[0];
    } catch (err) {
        console.log(err);
    }
}

// parameters:
//   user: fb id 
// returns: (int) index if found, -1 otherwise
// reminder: index is 0-based, spreadsheets are 1-based
function findUser(user) {
    return getUsers().findIndex(e => e == user);
}

// parameters:
//   user    : fb id
//   friends : [fb id]
// returns: n/a
function insertData(user, friends) {
    let index = findUser(user);
    if (index === -1) {
        sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: "1zPb-lWbmgpKN996pcDyKXExCvJynCbJ6P1k0vtsxzE8",
            range: "Sheet1",
            valueInputOption: "RAW",
            resource: {values: [user, friends]} // later add back .join at the end, this is just for testing purposes
        }, (err, result) => {
            if (err) console.log(err);
            return;
        });
    } else {
        sheets.spreadsheets.values.update({
            auth: jwtClient,
            spreadsheetId: "1zPb-lWbmgpKN996pcDyKXExCvJynCbJ6P1k0vtsxzE8",
            range: "Sheet1!A"+index,
            valueInputOption: "RAW",
            resource: {values: [user, friends]} // ditto
        }, (err, result) => {
            if (err) console.log(err);
            return;
        });
    }
}

function deleteData(user) {
    return;
}