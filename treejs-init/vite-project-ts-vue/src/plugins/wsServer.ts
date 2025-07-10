import type { Server } from "http";
import WebSocket, { WebSocketServer } from "ws";

export const setupWebSocket = (
  httpServer: Server,
  clients: Set<WebSocket>,
  debug: boolean,
) => {
  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", (ws) => {
    if (debug) console.log("[WS] client connected");
    clients.add(ws);
    ws.on("close", () => {
      if (debug) console.log("[WS] client disconnected");
      clients.delete(ws);
    });
    ws.on("error", (err) => {
      if (debug) console.error("[WS] error", err);
      clients.delete(ws);
    });
  });
  return wss;
};
