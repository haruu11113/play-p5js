import { ref, readonly, type Ref, type Readonly } from 'vue';

export type SensorData = { x: number; y: number; z: number };

export function useSensorData() {
  const sensorData: Ref<SensorData> = ref({ x: 0, y: 0, z: 0 });
  const intensity: Ref<number> = ref(0.0);

  const calculateIntensity = (current: SensorData, previous: SensorData) => {
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const dz = current.z - previous.z;
    const delta = Math.hypot(dx, dy, dz);
    const magnitude = Math.hypot(current.x, current.y, current.z);
    const newIntensity = delta * 10.0 + magnitude * 0.5;

    intensity.value = intensity.value * 0.8 + newIntensity * 0.2;
    intensity.value = Math.min(1.0, Math.max(0.0, intensity.value));
  };

  const processMessage = (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type?.includes("acc")) {
        const previous = { ...sensorData.value };
        sensorData.value = { x: data.x || 0, y: data.y || 0, z: data.z || 0 };
        calculateIntensity(sensorData.value, previous);
      }
    } catch (err) {
      console.error("Failed to parse sensor data:", err);
    }
  };

  return {
    sensorData: readonly(sensorData),
    intensity: readonly(intensity),
    processMessage,
  };
}
