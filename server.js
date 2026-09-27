const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const handleItemsRoutes = require("./src/routes/item");

const PORT = 3001;
const PUBLIC_PATH = path.join(__dirname, "public");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif"
};

const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    if (handleItemsRoutes(req, res)) return;

    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        let pathname = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
        const ext = path.extname(pathname);
        const fullPath = path.join(PUBLIC_PATH, pathname);
        
        const contentType = MIME_TYPES[ext] || "text/plain";
        const content = await fs.readFile(fullPath);

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    } catch (err) {
        const statusCode = err.code === "ENOENT" ? 404 : err.statusCode || 500;

        res.writeHead(statusCode, { "Content-Type": "text/plain" });
        res.end(`${statusCode} - ${err.message}`);
    }
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});