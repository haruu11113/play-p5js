import * as dgram from "dgram";

export interface SensorData {
  type?: string;
  x?: number;
  y?: number;
  z?: number;
}

export const parseSensorData = (raw: string): SensorData => {
  try {
    return JSON.parse(raw);
  } catch {
    // CSV 形式のパース処理…
    // （先ほどのコードをそのまま移植してください）
    throw new Error("Unknown data format");
  }
};

export const setupUdp = (
  port: number,
  onData: (data: SensorData) => void,
  debug: boolean,
) => {
  const socket = dgram.createSocket("udp4");
  socket.on("message", (msg, rinfo) => {
    const raw = msg.toString().trim();
    if (debug)
      console.log("[UDP] From", `${rinfo.address}:${rinfo.port}`, "Raw:", raw);
    try {
      const sensor = parseSensorData(raw);
      onData(sensor);
      if (debug) console.log("[UDP] Parsed", sensor);
    } catch (e: unknown) {
      if (debug && e instanceof Error) {
        console.error("[UDP] parse error:", e.message);
      }
    }
  });
  socket.on("error", (err) => console.error("[UDP] error", err));
  socket.bind(port, () => {
    if (debug) console.log(`[UDP] listening on port ${port}`);
  });
  return socket;
};
