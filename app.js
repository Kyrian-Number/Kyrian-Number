var http = require('http'),
    fs = require('fs'),
	express = require('express'),
	app = express(),
    path = require('path');

app.use(express.static(path.join(__dirname, '/')));

app.listen(process.env.PORT);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});