const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const publicFiles = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/index.html": ["index.html", "text/html; charset=utf-8"],
    "/style.css": ["style.css", "text/css; charset=utf-8"],
    "/levels.js": ["levels.js", "text/javascript; charset=utf-8"],
    "/script.js": ["script.js", "text/javascript; charset=utf-8"]
};

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end();
        return;
    }

    let pathname;
    try {
        pathname = new URL(request.url, "http://localhost").pathname;
    } catch {
        response.writeHead(400);
        response.end();
        return;
    }

    if (pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
    }

    const file = publicFiles[pathname];
    if (!file) {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    response.setHeader("Content-Type", file[1]);
    response.setHeader("Cache-Control", "no-store");

    const stream = fs.createReadStream(path.join(__dirname, file[0]));
    stream.on("error", () => {
        if (!response.headersSent) {
            response.writeHead(500);
        }
        response.end("Unable to read file");
    });

    if (request.method === "HEAD") {
        stream.destroy();
        response.end();
        return;
    }

    stream.pipe(response);
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, "0.0.0.0", () => {
    console.log(`Crossword preview running on port ${port}`);
});