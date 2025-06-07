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
const DEFAULT_SPHERE_DETAIL = 96;  // 球体の初期詳細度
const MIN_SPHERE_DETAIL = 24;      // 球体の最小詳細度
const MAX_SPHERE_DETAIL = 144;     // 球体の最大詳細度
const SPHERE_DETAIL_STEP = 12;     // 詳細度の変更ステップ
const DEFAULT_SPHERE_RADIUS = 200; // 球体の半径

// 回転の設定
const DEFAULT_ROTATION_SPEED = 0.01; // 基本回転速度
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
}

/**
 * UI要素の作成
 */
function createUI() {
  // 説明テキストの表示
  createInstructions();
  
  // 統計情報の表示
  createStats();
  
  // 初期表示状態の設定
  updateUIVisibility();
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
    '<li>I: 操作方法表示 ON/OFF</li>' +
    '<li>S: 統計情報表示 ON/OFF</li>' +
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
 * メインの描画ループ
 */
function draw() {
  // 背景を黒に設定
  background(0);
  
  // 経過時間を計算（秒単位）
  let elapsedTime = calculateElapsedTime();
  
  // シェーダーに時間を渡す
  updateShaderUniforms(elapsedTime);
  
  // 回転の更新と適用
  updateRotation();
  
  // 3Dオブジェクトの描画
  renderObject();
  
  // 統計情報の更新（表示されている場合のみ）
  if (show_stats) {
    updateStats();
  }
}

/**
 * 経過時間の計算
 * @returns {number} 経過時間（秒）
 */
function calculateElapsedTime() {
  return (millis() - startTime) / 1000.0;
}

/**
 * シェーダーのユニフォーム変数を更新
 * @param {number} elapsedTime - 経過時間（秒）
 */
function updateShaderUniforms(elapsedTime) {
  normalShader.setUniform('uTime', elapsedTime);
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
  
  statsDiv.html(
    `FPS: ${fps}<br>` +
    `詳細度: ${sphereDetail}<br>` +
    `自動回転: ${autoRotateStatus}<br>` +
    `回転角度: (${rotationX.toFixed(2)}, ${rotationY.toFixed(2)})`
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
  switch (key) {
    case ' ':
      toggleAutoRotate();
      break;
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
  }
}

/**
 * 自動回転のオン/オフを切り替え
 */
function toggleAutoRotate() {
  autoRotate = !autoRotate;
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
