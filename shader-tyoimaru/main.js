//=============================================================================
// Shader-Tyoimaru - メインスクリプト
// 滑らかな曲線を持つ動的な3Dオブジェクトを表示するWebGLシェーダープロジェクト
//=============================================================================

//-----------------------------------------------------------------------------
// 設定パラメータ
//-----------------------------------------------------------------------------
// UI表示設定
let show_instructions = true;  // 操作方法の表示フラグ
let show_stats = true;         // 統計情報の表示フラグ

//-----------------------------------------------------------------------------
// 定数
//-----------------------------------------------------------------------------
// 球体の設定
const DEFAULT_SPHERE_DETAIL = 1024;  // 球体の初期詳細度
const MIN_SPHERE_DETAIL = 12;      // 球体の最小詳細度
const MAX_SPHERE_DETAIL = 1024;     // 球体の最大詳細度
const SPHERE_DETAIL_STEP = 64;     // 詳細度の変更ステップ
const DEFAULT_SPHERE_RADIUS = 200; // 球体の半径

// 回転の設定
const DEFAULT_ROTATION_SPEED = 0.05; // 基本回転速度
const ROTATION_Y_FACTOR = 1.0;       // Y軸回転の係数
const ROTATION_X_FACTOR = 0.7;       // X軸回転の係数
const MOUSE_SENSITIVITY = 0.01;      // マウス感度

//-----------------------------------------------------------------------------
// 変数
//-----------------------------------------------------------------------------
// シェーダーと時間
let normalShader;      // シェーダーオブジェクト
let startTime;         // 開始時間

// 球体の状態
let sphereDetail = DEFAULT_SPHERE_DETAIL; // 球体の詳細度
let sphereRadius = DEFAULT_SPHERE_RADIUS; // 球体の半径

// 回転の状態
let rotationSpeed = DEFAULT_ROTATION_SPEED; // 回転速度
let rotationX = 0;     // X軸回りの回転角度
let rotationY = 0;     // Y軸回りの回転角度
let autoRotate = true; // 自動回転フラグ

// マウス制御
let mouseControlled = false; // マウス制御フラグ
let lastMouseX, lastMouseY; // 前回のマウス位置

// UI要素
let instructionsDiv;   // 説明テキスト要素
let statsDiv;          // 統計情報要素
let wsStatusDiv;       // WebSocket状態表示要素
let paramsDebugDiv;    // パラメータデバッグ表示要素
let paramsDebugTimer;  // パラメータデバッグ表示タイマー

// WebSocket関連
let ws;                // WebSocketオブジェクト
let wsConnected = false; // WebSocket接続状態
let wsLastMessage = ""; // 最後に受信したメッセージ

// シェーダーパラメータ
let shaderParams = {
  // 頂点シェーダーパラメータ
  timeScale: 0.52,           // 時間変化の速度
  distortionAmount: 0.9,    // 歪みの強さ
  secondaryWaveAmplitude: 0.95, // 二次的な波の振幅
  bumpStrength: 0.2,         // 膨らみの強さ
  
  // フラグメントシェーダーパラメータ
  baseHue: 0.7,              // 基本色相
  hueVariation: 0.3,         // 色相の変化量
  hueTimeFactor: 0.1,        // 色相の時間変化量
  timeSpeed: 0.2,            // ノイズの時間変化速度
  edgePower: 2.0,            // エッジ強調の強さ
  pulseAmplitude: 0.05,      // 脈動の強さ
  pulseSpeed: 2.0            // 脈動の速度
};

//=============================================================================
// 初期化関数
//=============================================================================

/**
 * シェーダーファイルの読み込み
 */
function preload() {
  normalShader = loadShader('normal.vert', 'normal.frag');
}

/**
 * 初期設定
 */
function setup() {
  // キャンバスの作成
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  
  // シェーダーの設定
  shader(normalShader);
  
  // フレームレートの設定
  frameRate(30);
  
  // 開始時間の記録
  startTime = millis();
  
  // UI要素の作成
  createUI();
  
  // キーボードイベントの追加設定
  document.addEventListener('keydown', function(event) {
    // スペースキーが押されたとき
    if (event.key === ' ' || event.keyCode === 32) {
      console.log('Spacebar detected via document event listener');
      toggleAutoRotate();
      event.preventDefault(); // デフォルト動作を防止
    }
  });
  
  // WebSocket接続の初期化
  initWebSocket();
}

/**
 * WebSocket接続の初期化
 */
function initWebSocket() {
  // WebSocketサーバーのURLを設定
  // 現在のホスト名を使用して自動的にURLを構築
  // 注: サーバーが別のマシンで実行されている場合は、手動で設定する必要があります
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? window.location.hostname  // ローカルホストの場合はそのまま使用
    : window.location.hostname; // それ以外の場合もホスト名を使用
  
  const wsUrl = `ws://${host}:8080`;
  console.log(`WebSocketサーバーに接続を試みます: ${wsUrl}`);
  
  try {
    // WebSocketオブジェクトの作成
    ws = new WebSocket(wsUrl);
    
    // 接続イベントのハンドラ
    ws.onopen = function(event) {
      console.log("WebSocket接続が確立されました");
      wsConnected = true;
      updateWsStatus("接続済み", "green");
    };
    
    // メッセージ受信イベントのハンドラ
    ws.onmessage = function(event) {
      console.log("WebSocketメッセージを受信:", event.data);
      wsLastMessage = event.data;
      updateWsStatus("データ受信", "green");
      
      // 受信したJSONデータを解析
      try {
        const data = JSON.parse(event.data);
        updateShaderParams(data);
      } catch (e) {
        console.error("JSONデータの解析に失敗:", e);
        updateWsStatus("データ形式エラー", "orange");
      }
    };
    
    // エラーイベントのハンドラ
    ws.onerror = function(event) {
      console.error("WebSocketエラー:", event);
      wsConnected = false;
      updateWsStatus("エラー", "red");
    };
    
    // 接続終了イベントのハンドラ
    ws.onclose = function(event) {
      console.log("WebSocket接続が閉じられました");
      wsConnected = false;
      updateWsStatus("切断", "gray");
      
      // 5秒後に再接続を試みる
      setTimeout(initWebSocket, 5000);
    };
  } catch (e) {
    console.error("WebSocket初期化エラー:", e);
    updateWsStatus("初期化エラー", "red");
  }
}

/**
 * WebSocket状態表示の更新
 * @param {string} status - 状態テキスト
 * @param {string} color - 状態表示の色
 */
function updateWsStatus(status, color) {
  if (wsStatusDiv) {
    wsStatusDiv.html(`WebSocket: ${status}`);
    wsStatusDiv.style('color', color);
  }
}


/**
 * UI要素の作成
 */
function createUI() {
  // 説明テキストの表示
  createInstructions();
  
  // 統計情報の表示
  createStats();
  
  // パラメータデバッグ表示の作成
  createParamsDebug();
  
  // 初期表示状態の設定
  updateUIVisibility();
}

/**
 * パラメータデバッグ表示の作成
 */
function createParamsDebug() {
  paramsDebugDiv = createDiv('');
  
  styleElement(paramsDebugDiv, {
    'position': 'absolute',
    'top': '50%',
    'left': '50%',
    'transform': 'translate(-50%, -50%)',
    'background-color': 'rgba(0, 0, 0, 0.8)',
    'color': 'lime',
    'padding': '15px',
    'border-radius': '10px',
    'font-family': 'monospace',
    'font-size': '14px',
    'z-index': '200',
    'max-width': '80%',
    'text-align': 'left',
    'display': 'none',
    'box-shadow': '0 0 20px rgba(0, 255, 0, 0.5)'
  });
}

/**
 * 説明テキストの表示
 */
function createInstructions() {
  instructionsDiv = createDiv(
    '<p>操作方法:</p>' +
    '<ul>' +
    '<li>マウスドラッグ: 回転</li>' +
    '<li>スペース: 自動回転 ON/OFF</li>' +
    '<li>R: 回転リセット</li>' +
    '<li>+/-: 詳細度の調整</li>' +
    '<li>I: 操作方法 表示/非表示</li>' +
    '<li>S: 統計情報 表示/非表示</li>' +
    '<li>W: WebSocket接続テスト</li>' +
    '</ul>'
  );
  
  styleElement(instructionsDiv, {
    'position': 'absolute',
    'top': '10px',
    'left': '10px',
    'background-color': 'rgba(0, 0, 0, 0.7)',
    'color': 'white',
    'padding': '10px',
    'border-radius': '5px',
    'font-family': 'sans-serif',
    'font-size': '14px',
    'z-index': '100'
  });
  
  // 自動回転切り替えボタンを追加
  let autoRotateButton = createButton('自動回転: ON');
  autoRotateButton.position(10, instructionsDiv.size().height + 20);
  autoRotateButton.style('background-color', 'rgba(0, 0, 0, 0.7)');
  autoRotateButton.style('color', 'white');
  autoRotateButton.style('border', 'none');
  autoRotateButton.style('padding', '8px 12px');
  autoRotateButton.style('border-radius', '5px');
  autoRotateButton.style('cursor', 'pointer');
  autoRotateButton.style('font-family', 'sans-serif');
  autoRotateButton.style('z-index', '100');
  
  // ボタンクリック時の処理
  autoRotateButton.mousePressed(() => {
    toggleAutoRotate();
    autoRotateButton.html('自動回転: ' + (autoRotate ? 'ON' : 'OFF'));
  });
  
  // WebSocket状態表示の追加
  wsStatusDiv = createDiv('WebSocket: 未接続');
  wsStatusDiv.position(10, instructionsDiv.size().height + 70);
  wsStatusDiv.style('background-color', 'rgba(0, 0, 0, 0.7)');
  wsStatusDiv.style('color', 'gray');
  wsStatusDiv.style('padding', '8px 12px');
  wsStatusDiv.style('border-radius', '5px');
  wsStatusDiv.style('font-family', 'sans-serif');
  wsStatusDiv.style('font-size', '14px');
  wsStatusDiv.style('z-index', '100');
}

/**
 * 統計情報の表示
 */
function createStats() {
  statsDiv = createDiv('');
  
  styleElement(statsDiv, {
    'position': 'absolute',
    'bottom': '10px',
    'right': '10px',
    'background-color': 'rgba(0, 0, 0, 0.7)',
    'color': 'white',
    'padding': '10px',
    'border-radius': '5px',
    'font-family': 'monospace',
    'font-size': '12px',
    'z-index': '100'
  });
  
  // 初期更新
  updateStats();
}

/**
 * UI要素の表示/非表示を更新
 */
function updateUIVisibility() {
  // 操作方法の表示/非表示
  if (show_instructions) {
    instructionsDiv.show();
  } else {
    instructionsDiv.hide();
  }
  
  // 統計情報の表示/非表示
  if (show_stats) {
    statsDiv.show();
  } else {
    statsDiv.hide();
  }
}

/**
 * 要素のスタイル設定ヘルパー関数
 * @param {Element} element - スタイルを設定する要素
 * @param {Object} styles - スタイルのキーと値のペア
 */
function styleElement(element, styles) {
  for (const [property, value] of Object.entries(styles)) {
    element.style(property, value);
  }
}

//=============================================================================
// メインループ
//=============================================================================

/**
 * シェーダーパラメータの更新
 * @param {Object} data - 受信したパラメータデータ
 */
function updateShaderParams(data) {
  // 変更されたパラメータを追跡
  const changedParams = {};
  
  // 頂点シェーダーパラメータの更新
  if (data.timeScale !== undefined) {
    changedParams.timeScale = data.timeScale;
    shaderParams.timeScale = data.timeScale;
  }
  if (data.distortionAmount !== undefined) {
    changedParams.distortionAmount = data.distortionAmount;
    shaderParams.distortionAmount = data.distortionAmount;
  }
  if (data.secondaryWaveAmplitude !== undefined) {
    changedParams.secondaryWaveAmplitude = data.secondaryWaveAmplitude;
    shaderParams.secondaryWaveAmplitude = data.secondaryWaveAmplitude;
  }
  if (data.bumpStrength !== undefined) {
    changedParams.bumpStrength = data.bumpStrength;
    shaderParams.bumpStrength = data.bumpStrength;
  }
  
  // フラグメントシェーダーパラメータの更新
  if (data.baseHue !== undefined) {
    changedParams.baseHue = data.baseHue;
    shaderParams.baseHue = data.baseHue;
  }
  if (data.hueVariation !== undefined) {
    changedParams.hueVariation = data.hueVariation;
    shaderParams.hueVariation = data.hueVariation;
  }
  if (data.hueTimeFactor !== undefined) {
    changedParams.hueTimeFactor = data.hueTimeFactor;
    shaderParams.hueTimeFactor = data.hueTimeFactor;
  }
  if (data.timeSpeed !== undefined) {
    changedParams.timeSpeed = data.timeSpeed;
    shaderParams.timeSpeed = data.timeSpeed;
  }
  if (data.edgePower !== undefined) {
    changedParams.edgePower = data.edgePower;
    shaderParams.edgePower = data.edgePower;
  }
  if (data.pulseAmplitude !== undefined) {
    changedParams.pulseAmplitude = data.pulseAmplitude;
    shaderParams.pulseAmplitude = data.pulseAmplitude;
  }
  if (data.pulseSpeed !== undefined) {
    changedParams.pulseSpeed = data.pulseSpeed;
    shaderParams.pulseSpeed = data.pulseSpeed;
  }
  
  // その他のパラメータの更新
  if (data.rotationSpeed !== undefined) {
    changedParams.rotationSpeed = data.rotationSpeed;
    rotationSpeed = data.rotationSpeed;
  }
  if (data.sphereDetail !== undefined) {
    changedParams.sphereDetail = data.sphereDetail;
    sphereDetail = constrain(data.sphereDetail, MIN_SPHERE_DETAIL, MAX_SPHERE_DETAIL);
  }
  if (data.autoRotate !== undefined) {
    changedParams.autoRotate = data.autoRotate;
    autoRotate = data.autoRotate;
  }
  
  // 統計情報の更新
  if (show_stats) {
    updateStats();
  }
  
  // パラメータデバッグ表示の更新
  showParamsDebug(changedParams);
}

/**
 * パラメータデバッグ表示の更新
 * @param {Object} params - 表示するパラメータ
 */
function showParamsDebug(params) {
  // パラメータが空の場合は何もしない
  if (Object.keys(params).length === 0) return;
  
  // 既存のタイマーをクリア
  if (paramsDebugTimer) {
    clearTimeout(paramsDebugTimer);
  }
  
  // パラメータ表示テキストの作成
  let debugText = '<h3>受信パラメータ:</h3>';
  for (const [key, value] of Object.entries(params)) {
    // 数値の場合は小数点以下3桁まで表示
    const displayValue = typeof value === 'number' ? value.toFixed(3) : value;
    debugText += `<div><span style="color: #88ff88">${key}:</span> ${displayValue}</div>`;
  }
  
  // パラメータデバッグ表示の更新と表示
  paramsDebugDiv.html(debugText);
  paramsDebugDiv.style('display', 'block');
  
  // 3秒後に非表示にする
  paramsDebugTimer = setTimeout(() => {
    paramsDebugDiv.style('display', 'none');
  }, 3000);
}

/**
 * シェーダーのユニフォーム変数を更新
 * @param {number} elapsedTime - 経過時間（秒）
 */
function updateShaderUniforms(elapsedTime) {
  // 基本的な時間ユニフォーム
  normalShader.setUniform('uTime', elapsedTime);
  
  // カスタムユニフォーム変数の設定
  // 頂点シェーダーパラメータ
  normalShader.setUniform('uTimeScale', shaderParams.timeScale);
  normalShader.setUniform('uDistortionAmount', shaderParams.distortionAmount);
  normalShader.setUniform('uSecondaryWaveAmplitude', shaderParams.secondaryWaveAmplitude);
  normalShader.setUniform('uBumpStrength', shaderParams.bumpStrength);
  
  // フラグメントシェーダーパラメータ
  normalShader.setUniform('uBaseHue', shaderParams.baseHue);
  normalShader.setUniform('uHueVariation', shaderParams.hueVariation);
  normalShader.setUniform('uHueTimeFactor', shaderParams.hueTimeFactor);
  normalShader.setUniform('uTimeSpeed', shaderParams.timeSpeed);
  normalShader.setUniform('uEdgePower', shaderParams.edgePower);
  normalShader.setUniform('uPulseAmplitude', shaderParams.pulseAmplitude);
  normalShader.setUniform('uPulseSpeed', shaderParams.pulseSpeed);
}

/**
 * 回転の更新と適用
 */
function updateRotation() {
  // 自動回転の適用
  if (autoRotate) {
    rotationY += rotationSpeed * ROTATION_Y_FACTOR;
    rotationX += rotationSpeed * ROTATION_X_FACTOR;
  }
  
  // 中心に移動
  translate(0, 0, 0);
  
  // 回転の適用
  rotateY(rotationY);
  rotateX(rotationX);
}

/**
 * 3Dオブジェクトの描画
 */
function renderObject() {
  // 不規則な形状を描画するための球体
  sphere(sphereRadius, sphereDetail);
}

/**
 * 統計情報の更新
 */
function updateStats() {
  const fps = frameRate().toFixed(1);
  const autoRotateStatus = autoRotate ? 'ON' : 'OFF';
  const wsStatus = wsConnected ? '接続中' : '未接続';
  
  statsDiv.html(
    `FPS: ${fps}<br>` +
    `詳細度: ${sphereDetail}<br>` +
    `自動回転: ${autoRotateStatus}<br>` +
    `回転角度: (${rotationX.toFixed(2)}, ${rotationY.toFixed(2)})<br>` +
    `WebSocket: ${wsStatus}<br>` +
    `回転速度: ${rotationSpeed.toFixed(3)}<br>` +
    `色相: ${shaderParams.baseHue.toFixed(2)}<br>` +
    `歪み: ${shaderParams.distortionAmount.toFixed(2)}`
  );
}

//=============================================================================
// イベントハンドラ
//=============================================================================

/**
 * ウィンドウサイズが変更されたときにキャンバスをリサイズ
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * マウスが押されたときの処理
 */
function mousePressed() {
  if (mouseButton === LEFT) {
    startMouseControl();
  }
}

/**
 * マウス制御の開始
 */
function startMouseControl() {
  mouseControlled = true;
  autoRotate = false;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

/**
 * マウスがドラッグされたときの処理
 */
function mouseDragged() {
  if (mouseControlled) {
    updateRotationFromMouse();
  }
}

/**
 * マウスの動きから回転を更新
 */
function updateRotationFromMouse() {
  // マウスの移動量に基づいて回転を更新
  let dx = mouseX - lastMouseX;
  let dy = mouseY - lastMouseY;
  
  rotationY += dx * MOUSE_SENSITIVITY;
  rotationX += dy * MOUSE_SENSITIVITY;
  
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

/**
 * マウスが離されたときの処理
 */
function mouseReleased() {
  mouseControlled = false;
}

/**
 * キーが押されたときの処理
 */
function keyPressed() {
  console.log('Key pressed:', key, 'keyCode:', keyCode);
  
  // スペースキーの処理を特別に扱う
  if (key === ' ' || keyCode === 32) {
    console.log('Spacebar pressed, toggling auto-rotation');
    toggleAutoRotate();
    return false; // スペースキーのデフォルト動作を防止
  }
  
  switch (key) {
    case 'r':
    case 'R':
      resetRotation();
      break;
    case '+':
    case '=':
      increaseSphereDetail();
      break;
    case '-':
    case '_':
      decreaseSphereDetail();
      break;
    case 'i':
    case 'I':
      toggleInstructions();
      break;
    case 's':
    case 'S':
      toggleStats();
      break;
    case 'w':
    case 'W':
      testWebSocketConnection();
      break;
  }
  
  // 特定のキーのデフォルト動作を防止
  if (['r', 'R', '+', '=', '-', '_', 'i', 'I', 's', 'S', 'w', 'W'].includes(key)) {
    return false;
  }
}

/**
 * WebSocket接続テスト
 */
function testWebSocketConnection() {
  if (wsConnected) {
    // テストメッセージの送信
    const testData = {
      type: "test",
      timestamp: Date.now(),
      message: "テスト接続"
    };
    
    try {
      ws.send(JSON.stringify(testData));
      console.log("テストメッセージを送信しました");
      updateWsStatus("テスト送信", "blue");
    } catch (e) {
      console.error("メッセージ送信エラー:", e);
      updateWsStatus("送信エラー", "red");
    }
  } else {
    console.log("WebSocket未接続のため、再接続を試みます");
    updateWsStatus("再接続中...", "orange");
    initWebSocket();
  }
}

/**
 * 自動回転のオン/オフを切り替え
 */
function toggleAutoRotate() {
  autoRotate = !autoRotate;
  console.log('Auto-rotation toggled:', autoRotate ? 'ON' : 'OFF');
  
  // WebSocketが接続されている場合、自動回転状態を送信
  if (wsConnected) {
    try {
      const data = {
        type: "control",
        action: "toggleAutoRotate",
        autoRotate: autoRotate
      };
      ws.send(JSON.stringify(data));
      console.log("自動回転状態を送信:", autoRotate);
    } catch (e) {
      console.error("自動回転状態の送信エラー:", e);
    }
  }
  
  // 統計情報を即時更新
  if (show_stats) {
    updateStats();
  }
}

/**
 * 回転をリセット
 */
function resetRotation() {
  rotationX = 0;
  rotationY = 0;
}

/**
 * 球体の詳細度を上げる
 */
function increaseSphereDetail() {
  sphereDetail = min(sphereDetail + SPHERE_DETAIL_STEP, MAX_SPHERE_DETAIL);
}

/**
 * 球体の詳細度を下げる
 */
function decreaseSphereDetail() {
  sphereDetail = max(sphereDetail - SPHERE_DETAIL_STEP, MIN_SPHERE_DETAIL);
}

/**
 * 操作方法表示のオン/オフを切り替え
 */
function toggleInstructions() {
  show_instructions = !show_instructions;
  updateUIVisibility();
}

/**
 * 統計情報表示のオン/オフを切り替え
 */
function toggleStats() {
  show_stats = !show_stats;
  updateUIVisibility();
}

/**
 * 描画ループ
 */
function draw() {
  // 背景のクリア
  background(0);
  
  // 経過時間の計算（秒単位）
  let elapsedTime = (millis() - startTime) / 1000.0;
  
  // シェーダーのユニフォーム変数を更新
  updateShaderUniforms(elapsedTime);
  
  // 回転の更新と適用
  updateRotation();
  
  // 3Dオブジェクトの描画
  renderObject();
}
