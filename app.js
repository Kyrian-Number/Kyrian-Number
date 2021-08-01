var http = require('http'),
    fs = require('fs'),
	express = require('express'),
	app = express(),
    path = require('path');

app.use(express.static(path.join(__dirname, '/')));

fs.readFile('./index.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    http.createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(html);  
        response.end();  
    }).listen(process.env.PORT);
});