//=============================================================================
// WebSocket Server for Shader-Tyoimaru
// 外部からシェーダーパラメータを制御するためのWebSocketサーバー
//=============================================================================

const WebSocket = require('ws');

// WebSocketサーバーの設定
const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

console.log(`WebSocketサーバーを起動しました (port: ${PORT})`);

// クライアント接続を管理する配列
const clients = new Set();

// クライアント接続時の処理
server.on('connection', (ws) => {
  console.log('新しいクライアントが接続しました');
  clients.add(ws);
  
  // 接続時に初期パラメータを送信
  sendInitialParameters(ws);
  
  // クライアントからのメッセージ受信時の処理
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('クライアントからメッセージを受信:', data);
      
      // テストメッセージの場合は応答を返す
      if (data.type === 'test') {
        ws.send(JSON.stringify({
          type: 'response',
          timestamp: Date.now(),
          message: 'テスト接続成功',
          received: data
        }));
      }
    } catch (e) {
      console.error('メッセージの解析に失敗:', e);
    }
  });
  
  // 接続終了時の処理
  ws.on('close', () => {
    console.log('クライアントが切断しました');
    clients.delete(ws);
  });
  
  // エラー発生時の処理
  ws.on('error', (error) => {
    console.error('WebSocketエラー:', error);
    clients.delete(ws);
  });
});

/**
 * 初期パラメータの送信
 * @param {WebSocket} ws - WebSocketクライアント
 */
function sendInitialParameters(ws) {
  const initialParams = {
    // 頂点シェーダーパラメータ
    timeScale: 0.12,
    distortionAmount: 0.45,
    secondaryWaveAmplitude: 0.15,
    bumpStrength: 0.2,
    
    // フラグメントシェーダーパラメータ
    baseHue: 0.7,
    hueVariation: 0.3,
    hueTimeFactor: 0.1,
    timeSpeed: 0.2,
    edgePower: 2.0,
    pulseAmplitude: 0.05,
    pulseSpeed: 2.0
  };
  
  ws.send(JSON.stringify(initialParams));
}

// ランダムなパラメータ更新を定期的に送信
setInterval(() => {
  if (clients.size > 0) {
    // ランダムなパラメータの生成
    const params = generateRandomParameters();
    
    // 全クライアントに送信
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(params));
      }
    }
    
    console.log('パラメータ更新を送信:', params);
  }
}, 5000); // 5秒ごとに更新

/**
 * ランダムなパラメータの生成
 * @returns {Object} ランダムなパラメータオブジェクト
 */
function generateRandomParameters() {
  // 更新するパラメータをランダムに選択（すべてを一度に変更しない）
  const params = {};
  const allParams = [
    'timeScale', 'distortionAmount', 'secondaryWaveAmplitude', 'bumpStrength',
    'baseHue', 'hueVariation', 'hueTimeFactor', 'timeSpeed',
    'edgePower', 'pulseAmplitude', 'pulseSpeed', 'rotationSpeed'
  ];
  
  // ランダムに1〜3個のパラメータを選択
  const numParams = Math.floor(Math.random() * 3) + 1;
  const selectedParams = shuffleArray(allParams).slice(0, numParams);
  
  // 選択したパラメータにランダムな値を設定
  for (const param of selectedParams) {
    switch (param) {
      case 'timeScale':
        params.timeScale = randomRange(0.05, 0.3);
        break;
      case 'distortionAmount':
        params.distortionAmount = randomRange(0.2, 0.8);
        break;
      case 'secondaryWaveAmplitude':
        params.secondaryWaveAmplitude = randomRange(0.05, 0.3);
        break;
      case 'bumpStrength':
        params.bumpStrength = randomRange(0.1, 0.4);
        break;
      case 'baseHue':
        params.baseHue = randomRange(0, 1);
        break;
      case 'hueVariation':
        params.hueVariation = randomRange(0.1, 0.5);
        break;
      case 'hueTimeFactor':
        params.hueTimeFactor = randomRange(0.05, 0.2);
        break;
      case 'timeSpeed':
        params.timeSpeed = randomRange(0.1, 0.4);
        break;
      case 'edgePower':
        params.edgePower = randomRange(1, 4);
        break;
      case 'pulseAmplitude':
        params.pulseAmplitude = randomRange(0.02, 0.1);
        break;
      case 'pulseSpeed':
        params.pulseSpeed = randomRange(1, 4);
        break;
      case 'rotationSpeed':
        params.rotationSpeed = randomRange(0.01, 0.1);
        break;
    }
  }
  
  return params;
}

/**
 * 指定された範囲内のランダムな数値を生成
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} ランダムな数値
 */
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * 配列をシャッフル
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフルされた配列
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
