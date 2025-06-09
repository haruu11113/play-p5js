# Shader-Tyoimaru with WebSocket Control

滑らかな曲線を持つ動的な3Dオブジェクトを表示するWebGLシェーダープロジェクト。
WebSocket通信を使用して、外部からシェーダーパラメータをリアルタイムに制御できます。

## 機能

- 滑らかな曲線を持つ動的な3Dオブジェクトの表示
- WebSocketを使用したリアルタイムパラメータ制御
- キーボードとマウスによるインタラクティブな操作
- 自動回転のON/OFF切り替え（スペースキー）
- 詳細度の調整（+/-キー）

## 使用方法

### 1. WebSocketサーバーの起動

WebSocketサーバーを起動するには、Python 3.7以上と`websockets`ライブラリがインストールされている必要があります。
まず、必要なパッケージをインストールします：

```bash
pip install -r requirements.txt
```

または直接インストールする場合：

```bash
pip install websockets
```

次に、WebSocketサーバーを起動します：

```bash
python ws_server.py
```

サーバーが起動すると、ポート8080でWebSocket接続を待ち受けます。サーバーの起動時に表示されるIPアドレスを確認してください。

#### コマンドラインオプション

WebSocketサーバーは以下のコマンドラインオプションをサポートしています：

```bash
python ws_server.py --host <ホスト名またはIPアドレス> --port <ポート番号>
```

- `--host`: サーバーがバインドするホスト名またはIPアドレス（デフォルト: 0.0.0.0）
- `--port`: サーバーが使用するポート番号（デフォルト: 8080）

例：

```bash
python ws_server.py --port 9000
```

### 1.5. WebSocketクライアントの使用（オプション）

シェーダーパラメータを外部から制御するためのPythonベースのWebSocketクライアントも用意されています。
このクライアントを使用すると、コマンドラインからパラメータを送信できます。

```bash
python ws_client.py [オプション]
```

#### クライアントのコマンドラインオプション

```bash
# サーバー接続設定
--server <ホスト名:ポート>  # WebSocketサーバーのアドレス（デフォルト: localhost:8080）

# 頂点シェーダーパラメータ
--timeScale <値>            # 時間変化の速度（0.05〜0.3）
--distortionAmount <値>     # 歪みの強さ（0.2〜0.8）
--secondaryWaveAmplitude <値> # 二次的な波の振幅（0.05〜0.3）
--bumpStrength <値>         # 膨らみの強さ（0.1〜0.4）

# フラグメントシェーダーパラメータ
--baseHue <値>              # 基本色相（0〜1）
--hueVariation <値>         # 色相の変化量（0.1〜0.5）
--hueTimeFactor <値>        # 色相の時間変化量（0.05〜0.2）
--timeSpeed <値>            # ノイズの時間変化速度（0.1〜0.4）
--edgePower <値>            # エッジ強調の強さ（1〜4）
--pulseAmplitude <値>       # 脈動の強さ（0.02〜0.1）
--pulseSpeed <値>           # 脈動の速度（1〜4）

# その他のパラメータ
--rotationSpeed <値>        # 回転速度（0.01〜0.1）
--autoRotate <true/false>   # 自動回転のON/OFF
--sphereDetail <値>         # 球体の詳細度（12〜1024）

# 特殊オプション
--random                    # ランダムなパラメータを生成して送信
```

#### 使用例

```bash
# 基本色相と歪みを設定
python ws_client.py --baseHue 0.3 --distortionAmount 0.6

# 自動回転をOFFに設定
python ws_client.py --autoRotate false

# ランダムなパラメータを生成して送信
python ws_client.py --random

# 別のサーバーに接続してパラメータを送信
python ws_client.py --server 192.168.1.100:8080 --baseHue 0.5 --rotationSpeed 0.08
```

### 2. シェーダーアプリケーションの実行

任意のWebサーバーを使用して、index.htmlをブラウザで開きます。
例えば、Python 3の組み込みHTTPサーバーを使用する場合：

```bash
python -m http.server
```

そして、ブラウザで http://localhost:8000 にアクセスします。

### 3. WebSocket接続のテスト

アプリケーションが起動すると、自動的にWebSocketサーバーへの接続を試みます。
接続状態は画面左上に表示されます。

「W」キーを押すと、WebSocket接続のテストメッセージを送信します。

## 制御可能なパラメータ

WebSocketを通じて以下のパラメータを制御できます：

### 頂点シェーダーパラメータ

- `timeScale`: 時間変化の速度（0.05〜0.3）
- `distortionAmount`: 歪みの強さ（0.2〜0.8）
- `secondaryWaveAmplitude`: 二次的な波の振幅（0.05〜0.3）
- `bumpStrength`: 膨らみの強さ（0.1〜0.4）

### フラグメントシェーダーパラメータ

- `baseHue`: 基本色相（0〜1）
- `hueVariation`: 色相のノイズによる変化量（0.1〜0.5）
- `hueTimeFactor`: 色相の時間による変化量（0.05〜0.2）
- `timeSpeed`: ノイズの時間変化速度（0.1〜0.4）
- `edgePower`: エッジ強調の強さ（1〜4）
- `pulseAmplitude`: 脈動の強さ（0.02〜0.1）
- `pulseSpeed`: 脈動の速度（1〜4）

### その他のパラメータ

- `rotationSpeed`: 回転速度（0.01〜0.1）
- `autoRotate`: 自動回転のON/OFF（true/false）
- `sphereDetail`: 球体の詳細度（12〜1024）

## WebSocketメッセージ形式

WebSocketを通じて送信するメッセージは、JSONオブジェクトの形式である必要があります。
例：

```json
{
  "baseHue": 0.3,
  "distortionAmount": 0.6,
  "rotationSpeed": 0.05
}
```

## キーボード操作

- スペース: 自動回転 ON/OFF
- R: 回転リセット
- +/-: 詳細度の調整
- I: 操作方法 表示/非表示
- S: 統計情報 表示/非表示
- W: WebSocket接続テスト

## マウス操作

- ドラッグ: 回転

## 技術的な詳細

このプロジェクトは以下の技術を使用しています：

- WebGL (p5.js経由)
- GLSL (シェーダー言語)
- WebSocket (リアルタイム通信)
- JavaScript (クライアントサイドロジック)
- Python (WebSocketサーバー)

## カスタマイズ

### WebSocketサーバーのカスタマイズ

WebSocketサーバーは、以下の方法でカスタマイズできます：

1. **送信パラメータの変更**: `ws_server.py`の`send_initial_parameters`関数と`generate_random_parameters`関数を編集して、送信するパラメータとその範囲を変更できます。

2. **送信間隔の変更**: `ws_server.py`の`send_random_parameters`関数内の`await asyncio.sleep(5)`の値を変更することで、パラメータ更新の間隔を調整できます。

### クライアント側のカスタマイズ

クライアント側は自動的にWebSocketサーバーに接続しようとしますが、別のサーバーに接続する場合は、`main.js`の`initWebSocket`関数内のWebSocketサーバーのURLを変更してください。

```javascript
// 特定のサーバーに接続する場合は、以下のようにURLを直接指定します
const wsUrl = "ws://example.com:8080";
