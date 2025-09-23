const http = require('http');
const url = require('url');

http.createServer((req, res) => {
    const q = url.parse(req.url, true);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<p style=\"color:blue;\">" + 'Hello ' + q.query.name + ', What a beautiful day. Server current date and time is ' +  new Date() + "</p>");
}).listen(8888);