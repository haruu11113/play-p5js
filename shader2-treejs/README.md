# Accelerometer Data Visualization with WebGL Shaders

リアルタイム加速度センサーデータをUDP経由で受信し、WebGLシェーダーで動的に可視化するアプリケーションです。

## 機能

- **リアルタイムデータ受信**: UDPで加速度センサーデータを受信
- **WebSocket通信**: UDPデータをWebSocketでブラウザに配信
- **インテンシティ計算**: 動きの激しさを自動計算
- **シェーダー可視化**: センサーデータに基づいて3D形状と色彩がリアルタイムで変化
- **自動再接続**: WebSocket切断時の自動再接続機能（5秒間隔）
- **レスポンシブ対応**: ウィンドウリサイズ時の自動キャンバス調整

## 加速度センサーデータの視覚化

### 形状変化（動きの激しさに応じて変化）
- **ノイズスケール**: インテンシティが高いほど複雑な変形
- **時間スケール**: インテンシティが高いほど高速な変化
- **変形量**: インテンシティが高いほど大きな変形
- **加速度オフセット**: X/Y/Z軸の値がノイズに直接影響

### 色彩変化
- **色相**: 動きが激しいほど青→赤に変化
- **彩度**: インテンシティが高いほど鮮やかに
- **明度**: インテンシティが高いほど明るく
- **脈動**: 動きが激しいほど強く高速な脈動（青紫から赤橙に変化）

### 回転制御
- **X軸回転**: 基本回転（frameCount * 0.01）+ 加速度Y値による追加回転（sensorData.y * 0.1）
- **Y軸回転**: 基本回転（frameCount * 0.01）+ 加速度X値による追加回転（sensorData.x * 0.1）
- **Z軸回転**: 加速度Z値による回転（sensorData.z * 0.05）

### パフォーマンス設定
- **フレームレート**: 30fps固定（滑らかなアニメーションとパフォーマンスのバランス）
- **球体サイズ**: 半径200ピクセル
- **背景色**: 黒（0, 0, 0）

## セットアップ

### 1. 依存関係のインストール
```bash
cd shader2
npm install
```

### 2. アプリケーションの起動
```bash
# 統合サーバーの起動（推奨）
node unified-server.js

# または個別サーバーの起動
node ws-server.js

# デバッグモードで起動
node unified-server.js --debug
```

### 3. ブラウザでアクセス
- 可視化: http://localhost:8000
- デバッグモード: http://localhost:8000?debug
- WebSocketサーバー: ws://localhost:8080
- UDPサーバー: ポート6666

## インテンシティ計算

動きの激しさは以下の方法で自動計算されます：

1. **変化量の計算**: 前回のセンサー値との差分を計算
2. **加速度の大きさ**: 現在の加速度ベクトルの大きさを計算
3. **組み合わせ**: `intensity = (変化量 × 10.0) + (大きさ × 0.5)`
4. **スムージング**: 急激な変化を滑らかにする処理（前回値 × 0.8 + 新値 × 0.2）
5. **正規化**: 0-1の範囲にクランプ

## データ形式

UDPで送信する加速度センサーデータの形式:

### JSON形式
```json
{
  "type": "user-acc",
  "x": -0.127,
  "y": -0.055,
  "z": 0.975,
  "timestamp": 1234567890123
}
```

### CSV形式
```
user-acc,-0.127,-0.055,0.975
```

## シェーダーUniform変数

`main.js`からシェーダーに渡されるuniform変数：

- **uTime**: 経過時間（秒）
- **uAcceleration**: 加速度ベクトル [x, y, z]
- **uIntensity**: 計算されたインテンシティ値（0-1）

## カスタマイズ

### シェーダーパラメータの調整
- `normal.vert`: 変形パラメータ（noiseScale、timeScale、distortionAmount）
- `normal.frag`: 色相変化範囲（baseHue）、脈動強度（pulseIntensity）
- `main.js`: インテンシティ計算の係数、回転速度の調整

### 回転制御の調整
`main.js`の`draw()`関数で以下を調整可能：
- 基本回転速度: `frameCount * 0.01`
- X軸回転感度: `sensorData.y * 0.1`
- Y軸回転感度: `sensorData.x * 0.1`
- Z軸回転感度: `sensorData.z * 0.05`

### 通信設定の変更
- `unified-server.js` / `ws-server.js`: WebSocketとUDPのポート設定
- `main.js`: WebSocket接続先の変更（現在: ws://localhost:8080）

### インテンシティ計算の調整
`main.js`の`calculateIntensity()`関数で以下を調整可能：
- 変化量の係数: `delta * 10.0`
- 大きさの係数: `magnitude * 0.5`
- スムージング: `intensity * 0.8 + newIntensity * 0.2`

### パフォーマンス設定
- フレームレート: `frameRate(30)`を変更
- 球体サイズ: `sphere(200)`の値を変更
- 背景色: `background(0)`を変更

## ファイル構成

```
shader2/
├── index.html           # メインHTML
├── main.js              # p5.js メインスクリプト（WebSocket接続、インテンシティ計算、回転制御）
├── normal.vert          # 頂点シェーダー（変形制御）
├── normal.frag          # フラグメントシェーダー（色彩制御）
├── unified-server.js    # 統合サーバー（HTTP + WebSocket + UDP）
├── ws-server.js         # WebSocketサーバー（個別実行用）
├── package.json         # Node.js依存関係
├── package-lock.json    # 依存関係のロック
└── README.md            # このファイル
```

## デバッグ

### コンソール出力
- **WebSocket接続状況**: 接続・切断・エラーをログ出力
- **受信データ**: 全ての受信データをコンソールに表示
- **インテンシティ**: 計算されたインテンシティ値を表示

### サーバーデバッグ
```bash
# 詳細ログでサーバー起動
node unified-server.js --debug
```

受信したUDPデータの詳細情報を表示:
- Raw UDPデータ
- パース結果
- 送信先クライアント数

### 自動再接続
WebSocket接続が切断された場合、5秒後に自動的に再接続を試行します。