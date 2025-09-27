const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Utils = require('./modules/utils');

// Load greeting string from en.json
const strings = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'lang/messages/en/en.json'), 'utf8')
);

class Server {
    constructor(port) {
        this.port = port || 8888;
    }

    start() {
        http.createServer((req, res) => this.handleRequest(req, res))
            .listen(this.port, () => {
                console.log(`Server running at http://localhost:${this.port}/?name=Seogin`);
            });
    }

    handleRequest(req, res) {
        const q = url.parse(req.url, true);
        const name = q.query.name || "Guest";

        // Replace %1 in the greeting string
        const message = strings.greeting.replace("%1", name) + " " + Utils.getDate();

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<p style="color:blue;">${message}</p>`);
    }
}

const server = new Server(8888);
server.start();
