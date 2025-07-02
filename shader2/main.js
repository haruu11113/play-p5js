let normalShader;
let startTime;
let ws;
let sensorData = { x: 0, y: 0, z: 0 };
let previousSensorData = { x: 0, y: 0, z: 0 };
let intensity = 0.0;

function preload() {
  // シェーダーファイルを読み込む
  normalShader = loadShader("normal.vert", "normal.frag");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  shader(normalShader);
  frameRate(30);

  // 開始時間を記録
  startTime = millis();

  // WebSocket接続を開始
  connectWebSocket();
}

function connectWebSocket() {
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = function (event) {
    console.log("WebSocket接続が確立されました");
  };

  ws.onmessage = function (event) {
    try {
      const data = JSON.parse(event.data);
      if (data.type && data.type.includes("acc")) {
        // 前回の値を保存
        previousSensorData = { ...sensorData };

        // 新しいセンサーデータを更新
        sensorData = {
          x: data.x || 0,
          y: data.y || 0,
          z: data.z || 0,
        };

        // 動きの激しさを計算
        calculateIntensity();
      }
    } catch (error) {
      console.error("センサーデータの解析エラー:", error);
    }
  };

  ws.onclose = function (event) {
    console.log("WebSocket接続が閉じられました");
    // 5秒後に再接続を試行
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = function (error) {
    console.error("WebSocket エラー:", error);
  };
}

function calculateIntensity() {
  // センサーデータの変化量を計算
  const deltaX = sensorData.x - previousSensorData.x;
  const deltaY = sensorData.y - previousSensorData.y;
  const deltaZ = sensorData.z - previousSensorData.z;

  // 変化量の大きさを計算
  const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  // 現在の加速度の大きさを計算
  const magnitude = Math.sqrt(
    sensorData.x * sensorData.x +
      sensorData.y * sensorData.y +
      sensorData.z * sensorData.z
  );

  // 変化量と大きさを組み合わせて激しさを計算
  const newIntensity = delta * 10.0 + magnitude * 0.5;

  // スムージング（急激な変化を滑らかに）
  intensity = intensity * 0.8 + newIntensity * 0.2;

  // 0-1の範囲にクランプ
  intensity = Math.min(1.0, Math.max(0.0, intensity));
}

function draw() {
  background(0);

  let elapsedTime = (millis() - startTime) / 1000.0;

  normalShader.setUniform("uTime", elapsedTime);
  normalShader.setUniform("uAcceleration", [
    sensorData.x,
    sensorData.y,
    sensorData.z,
  ]);
  normalShader.setUniform("uIntensity", intensity);

  translate(0, 0, 0);

  rotateY(frameCount * 0.01 + sensorData.x * 0.1);
  rotateX(frameCount * 0.01 + sensorData.y * 0.1);
  rotateZ(sensorData.z * 0.05);

  sphere(200);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
