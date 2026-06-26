import { createServer } from "http";
import express from "express";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import wisp from "wisp-server-node";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);

// CORS für alle Requests erlauben
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// UV Kern-Dateien (Service Worker, Bundle, Handler)
app.use("/uv/", express.static(uvPath));

// Epoxy Transport (WebSocket-basiertes Proxying)
app.use("/epoxy/", express.static(epoxyPath));

// Bare-Mux (Transport-Abstraktion)
app.use("/baremux/", express.static(baremuxPath));

// Eigene statische Dateien (index.html, uv.config.js)
app.use(express.static(join(__dirname, "public")));

// Fallback: alle nicht gefundenen Routen → index.html
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Wisp WebSocket Proxy (das eigentliche Proxying)
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy Server läuft auf Port ${PORT}`);
  console.log(`   → Lokal: http://localhost:${PORT}`);
});
