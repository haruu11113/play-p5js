type SensorData = { x: number; y: number; z: number };

export let sensorData: SensorData = { x: 0, y: 0, z: 0 };
export let previousSensorData: SensorData = { x: 0, y: 0, z: 0 };

export const connectWebSocket = (): WebSocket => {
  const ws: WebSocket = new WebSocket(`ws://${window.location.host}/ws-udp`);
  ws.onopen = () => console.log("WebSocket connected");
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type?.includes("acc")) {
        previousSensorData = { ...sensorData };
        sensorData = { x: data.x || 0, y: data.y || 0, z: data.z || 0 };
        calculateIntensity();
      }
    } catch (err) {
      console.error("Failed to parse sensor data:", err);
    }
  };
  ws.onclose = () => {
    console.log("WebSocket closed, retrying in 5s");
    setTimeout(connectWebSocket, 50000);
  };
  ws.onerror = (err) => console.error("WebSocket error:", err);

  return ws;
};


export let intensity = 0.0;

const calculateIntensity = (): void => {
  const dx = sensorData.x - previousSensorData.x;
  const dy = sensorData.y - previousSensorData.y;
  const dz = sensorData.z - previousSensorData.z;
  const delta = Math.hypot(dx, dy, dz);
  const magnitude = Math.hypot(sensorData.x, sensorData.y, sensorData.z);
  const newIntensity = delta * 10.0 + magnitude * 0.5;
  intensity = intensity * 0.8 + newIntensity * 0.2;
  intensity = Math.min(1.0, Math.max(0.0, intensity));
};

