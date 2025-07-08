// src/plugins/ws-udp/index.ts
import type { Plugin } from "vite";
import WebSocket, { WebSocketServer } from "ws";
import { parseSensorData } from "./parseSensorData";
import * as dgram from "dgram";


const UDP_PORT = 6666;
const DEBUG = process.argv.includes("-d") || process.argv.includes("--debug");

export const wsUdpPlugin = (): Plugin => ({
  name: "vite-plugin-ws-udp",
  configureServer(server) {
    const httpServer = server.httpServer!;
    const clients = new Set<WebSocket>();

    // create a noServer WebSocketServer
    const wss = new WebSocketServer({ noServer: true });

    // hook the raw upgrade BEFORE any other middleware
    httpServer.on("upgrade", (req, socket, head) => {
      if (req.url === "/ws-udp") {
        if (DEBUG) console.log("[ws-udp] upgrade request detected");
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      }
    });

    wss.on("connection", (ws) => {
      if (DEBUG) console.log("[ws-udp] client connected");
      clients.add(ws);
      ws.on("close", () => clients.delete(ws));
      ws.on("error", () => clients.delete(ws));
    });

    const udpSocket = dgram.createSocket("udp4");
    udpSocket.on("message", (msg, rinfo) => {
      const data = parseSensorData(msg.toString().trim());
      const payload = JSON.stringify(data);
      for (const c of clients) {
        if (c.readyState === WebSocket.OPEN) c.send(payload);
      }
      DEBUG && console.log(`[ws-udp] broadcast to ${clients.size} clients`);
    });
    udpSocket.bind(
      UDP_PORT,
      () => DEBUG && console.log(`[ws-udp] UDP listening on ${UDP_PORT}`),
    );

    // clean up on exit
    process.on("SIGINT", () => {
      udpSocket.close();
      wss.close(() => process.exit(0));
    });

    DEBUG && console.log("[ws-udp] plugin configured");
  },
});
