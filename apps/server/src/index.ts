import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  type ClientToServerEvents,
  protocolVersion,
  type ServerToClientEvents,
} from "@itsvital/protocol";
import { attachRealtimeServer } from "./realtime/server.js";
import { InMemorySessionStore } from "./stores/InMemorySessionStore.js";

const port = Number(process.env.PORT ?? 3001);
const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.WEB_ORIGIN
  ? process.env.WEB_ORIGIN.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
    ];

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: allowedOrigins },
});

attachRealtimeServer(io, new InMemorySessionStore());

app.get("/health", (_request, response) => {
  response.json({ status: "ok", protocolVersion });
});

httpServer.listen(port, () => {
  console.log(`ItsVital server listening on http://localhost:${port}`);
});
