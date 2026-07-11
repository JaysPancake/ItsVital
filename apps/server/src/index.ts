import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { protocolVersion } from "@itsvital/protocol";

const port = Number(process.env.PORT ?? 3001);
const app = express();
const httpServer = createServer(app);

new Server(httpServer, {
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" },
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok", protocolVersion });
});

httpServer.listen(port, () => {
  console.log(`ItsVital server listening on http://localhost:${port}`);
});
