const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "items.json");

function readData() {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function writeData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
}

function handleItemsRoutes(req, res) {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/items")) return false;

    const id = Number(url.pathname.split("/").pop());

    if (req.method === "GET" && url.pathname === "/api/items") {
        sendJson(res, 200, readData());
        return true;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/items/")) {
        const item = readData().find(entry => entry.id === id);
        sendJson(res, item ? 200 : 404, item || { error: "Elemento no encontrado" });
        return true;
    }

    if (req.method === "POST" && url.pathname === "/api/items") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const values = JSON.parse(body);
                const name = typeof values.name === "string" ? values.name.trim() : "";
                if (!name) {
                    sendJson(res, 400, { error: "El nombre es obligatorio" });
                    return;
                }

                const items = readData();
                const item = {
                    id: Date.now(),
                    name,
                    description: typeof values.description === "string" ? values.description.trim() : ""
                };
                items.push(item);
                writeData(items);
                sendJson(res, 201, item);
            } catch {
                sendJson(res, 400, { error: "El cuerpo debe ser JSON válido" });
            }
        });
        return true;
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/items/")) {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const values = JSON.parse(body);
                const name = typeof values.name === "string" ? values.name.trim() : "";
                if (!name) {
                    sendJson(res, 400, { error: "El nombre es obligatorio" });
                    return;
                }

                const items = readData();
                const index = items.findIndex(entry => entry.id === id);
                if (index < 0) {
                    sendJson(res, 404, { error: "Elemento no encontrado" });
                    return;
                }

                const updated = {
                    ...items[index],
                    name,
                    description: typeof values.description === "string" ? values.description.trim() : ""
                };
                items[index] = updated;
                writeData(items);
                sendJson(res, 200, updated);
            } catch {
                sendJson(res, 400, { error: "El cuerpo debe ser JSON válido" });
            }
        });
        return true;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/items/")) {
        const items = readData();
        const remaining = items.filter(entry => entry.id !== id);
        if (remaining.length === items.length) {
            sendJson(res, 404, { error: "Elemento no encontrado" });
            return true;
        }

        writeData(remaining);
        sendJson(res, 200, { message: "Elemento eliminado" });
        return true;
    }

    sendJson(res, 404, { error: "Ruta no encontrada" });
    return true;
}

module.exports = handleItemsRoutes;