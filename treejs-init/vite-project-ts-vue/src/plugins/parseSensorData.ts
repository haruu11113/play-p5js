export interface SensorData {
  type: string;
  timestamp: number;
  x?: number;
  y?: number;
  z?: number;
  value?: number;
  intensity?: number;
}

export const parseSensorData = (rawMessage: string): SensorData => {
  // まず JSON として試行
  try {
    return JSON.parse(rawMessage) as SensorData;
  } catch {
    // JSON 失敗時は CSV 形式として解析
    if (rawMessage.includes(",")) {
      const parts = rawMessage.split(",");

      // "user-acc,-0.127,-0.055,0.975" のような形式を解析
      if (parts.length >= 4 && parts[0].includes("acc")) {
        return {
          type: parts[0],
          x: parseFloat(parts[1]) || 0,
          y: parseFloat(parts[2]) || 0,
          z: parseFloat(parts[3]) || 0,
          timestamp: Date.now(),
        };
      }

      // 他のセンサータイプ用の汎用パース
      if (parts.length >= 2) {
        const sensorType = parts[0];
        const values = parts.slice(1).map((v) => parseFloat(v) || 0);
        const result: SensorData = {
          type: sensorType,
          timestamp: Date.now(),
        };

        // 値の数に応じてプロパティ名を設定
        if (values.length >= 3) {
          [result.x, result.y, result.z] = values;
        } else if (values.length === 2) {
          [result.x, result.y] = values;
          result.z = 0;
        } else if (values.length === 1) {
          result.value = values[0];
          result.x = values[0];
          result.y = 0;
          result.z = 0;
        }

        // 追加値があれば intensity として格納
        if (values.length > 3) {
          result.intensity = values[3];
        }

        return result;
      }
    }

    // CSVでもない場合はエラーを投げる
    throw new Error("Unknown data format");
  }
};
