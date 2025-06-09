#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WebSocket Server for Shader-Tyoimaru
外部からシェーダーパラメータを制御するためのWebSocketサーバー (Python版)
"""

import asyncio
import json
import logging
import random
import sys
import socket
import argparse
import websockets
from datetime import datetime

# ロギングの設定
logging.basicConfig(
    format="%(asctime)s %(message)s",
    level=logging.INFO,
)

# WebSocketサーバーの設定
DEFAULT_HOST = "0.0.0.0"  # すべてのインターフェースでリッスン
DEFAULT_PORT = 8080
clients = set()

# 自分のIPアドレスを取得する関数
def get_local_ip():
    """ローカルIPアドレスを取得"""
    try:
        # UDPソケットを作成
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Googleのパブリックなサーバーに接続しようとする（実際には接続しない）
        s.connect(("8.8.8.8", 80))
        # 接続に使用されるIPアドレスを取得
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        logging.warning(f"ローカルIPアドレスの取得に失敗: {e}")
        return "127.0.0.1"

async def register(websocket):
    """クライアント接続の登録"""
    clients.add(websocket)
    logging.info(f"新しいクライアントが接続しました (合計: {len(clients)})")
    
    # 初期パラメータを送信
    await send_initial_parameters(websocket)

async def unregister(websocket):
    """クライアント接続の登録解除"""
    clients.remove(websocket)
    logging.info(f"クライアントが切断しました (残り: {len(clients)})")

async def send_initial_parameters(websocket):
    """初期パラメータの送信"""
    initial_params = {
        # 頂点シェーダーパラメータ
        "timeScale": 0.12,
        "distortionAmount": 0.45,
        "secondaryWaveAmplitude": 0.15,
        "bumpStrength": 0.2,
        
        # フラグメントシェーダーパラメータ
        "baseHue": 0.7,
        "hueVariation": 0.3,
        "hueTimeFactor": 0.1,
        "timeSpeed": 0.2,
        "edgePower": 2.0,
        "pulseAmplitude": 0.05,
        "pulseSpeed": 2.0
    }
    
    await websocket.send(json.dumps(initial_params))
    logging.info(f"初期パラメータを送信しました: {initial_params}")

async def handle_message(websocket, message):
    """クライアントからのメッセージ処理"""
    try:
        data = json.loads(message)
        logging.info(f"クライアントからメッセージを受信: {data}")
        
        # テストメッセージの場合は応答を返す
        if data.get("type") == "test":
            response = {
                "type": "response",
                "timestamp": datetime.now().timestamp() * 1000,
                "message": "テスト接続成功",
                "received": data
            }
            await websocket.send(json.dumps(response))
            logging.info(f"テスト応答を送信しました: {response}")
        
        # 制御メッセージの場合は全クライアントに転送
        elif data.get("type") == "control":
            action = data.get("action")
            
            # 自動回転の切り替え
            if action == "toggleAutoRotate":
                auto_rotate = data.get("autoRotate")
                broadcast_data = {
                    "autoRotate": auto_rotate
                }
                # 全クライアントに送信（送信元を除く）
                await broadcast_to_others(websocket, broadcast_data)
                logging.info(f"自動回転状態を全クライアントに送信: {auto_rotate}")
        
        # パラメータ更新メッセージの場合（ws_clientからの直接パラメータ）
        # typeフィールドがなく、シェーダーパラメータのキーが含まれている場合
        elif any(key in data for key in [
            "timeScale", "distortionAmount", "secondaryWaveAmplitude", "bumpStrength",
            "baseHue", "hueVariation", "hueTimeFactor", "timeSpeed",
            "edgePower", "pulseAmplitude", "pulseSpeed", "rotationSpeed",
            "autoRotate", "sphereDetail"
        ]):
            # パラメータを全クライアントに送信（送信元を含む）
            # 送信元を含むのは、送信元がws_clientの場合、ブラウザクライアントにも送信するため
            await broadcast_to_all(data)
            logging.info(f"ws_clientからのパラメータを全クライアントに送信: {data}")
    except json.JSONDecodeError:
        logging.error(f"JSONデータの解析に失敗: {message}")
    except Exception as e:
        logging.error(f"メッセージ処理中にエラーが発生: {e}")

async def broadcast_to_others(sender, data):
    """送信元を除く全クライアントにデータを送信"""
    if not clients:
        return
    
    # 送信元を除く全クライアントに送信
    websockets_tasks = [
        client.send(json.dumps(data))
        for client in clients
        if client != sender
    ]
    
    if websockets_tasks:
        await asyncio.gather(*websockets_tasks, return_exceptions=True)

async def broadcast_to_all(data):
    """全クライアントにデータを送信"""
    if not clients:
        return
    
    # 全クライアントに送信
    websockets_tasks = [
        client.send(json.dumps(data))
        for client in clients
    ]
    
    if websockets_tasks:
        await asyncio.gather(*websockets_tasks, return_exceptions=True)

def random_range(min_val, max_val):
    """指定された範囲内のランダムな数値を生成"""
    return min_val + random.random() * (max_val - min_val)

def generate_random_parameters():
    """ランダムなパラメータの生成"""
    # 更新するパラメータをランダムに選択（すべてを一度に変更しない）
    params = {}
    all_params = [
        "timeScale", "distortionAmount", "secondaryWaveAmplitude", "bumpStrength",
        "baseHue", "hueVariation", "hueTimeFactor", "timeSpeed",
        "edgePower", "pulseAmplitude", "pulseSpeed", "rotationSpeed"
    ]
    
    # ランダムに1〜3個のパラメータを選択
    num_params = random.randint(1, 3)
    random.shuffle(all_params)
    selected_params = all_params[:num_params]
    
    # 選択したパラメータにランダムな値を設定
    for param in selected_params:
        if param == "timeScale":
            params["timeScale"] = random_range(0.05, 0.3)
        elif param == "distortionAmount":
            params["distortionAmount"] = random_range(0.2, 0.8)
        elif param == "secondaryWaveAmplitude":
            params["secondaryWaveAmplitude"] = random_range(0.05, 0.3)
        elif param == "bumpStrength":
            params["bumpStrength"] = random_range(0.1, 0.4)
        elif param == "baseHue":
            params["baseHue"] = random_range(0, 1)
        elif param == "hueVariation":
            params["hueVariation"] = random_range(0.1, 0.5)
        elif param == "hueTimeFactor":
            params["hueTimeFactor"] = random_range(0.05, 0.2)
        elif param == "timeSpeed":
            params["timeSpeed"] = random_range(0.1, 0.4)
        elif param == "edgePower":
            params["edgePower"] = random_range(1, 4)
        elif param == "pulseAmplitude":
            params["pulseAmplitude"] = random_range(0.02, 0.1)
        elif param == "pulseSpeed":
            params["pulseSpeed"] = random_range(1, 4)
        elif param == "rotationSpeed":
            params["rotationSpeed"] = random_range(0.01, 0.1)
    
    return params

# 定期的なパラメータ送信機能は削除されました

async def ws_handler(websocket, path=None):
    """WebSocket接続ハンドラ
    
    注: pathパラメータはwebsocketsライブラリのバージョンによって必要な場合と不要な場合があります。
    websockets 10.0以上では不要、それ以前のバージョンでは必要です。
    """
    await register(websocket)
    try:
        async for message in websocket:
            await handle_message(websocket, message)
    except websockets.exceptions.ConnectionClosed:
        logging.info("接続が閉じられました")
    finally:
        await unregister(websocket)

async def main(host, port):
    """メイン関数"""
    try:
        # WebSocketサーバーの起動
        server = await websockets.serve(ws_handler, host, port)
        local_ip = get_local_ip()
        
        logging.info(f"WebSocketサーバーを起動しました")
        logging.info(f"ホスト: {host} (すべてのインターフェース)")
        logging.info(f"ポート: {port}")
        logging.info(f"接続URL: ws://{local_ip}:{port}")
        logging.info(f"クライアントの設定で使用するURL: ws://{local_ip}:{port}")
        logging.info("Ctrl+Cで終了します")
        
        # 定期的なパラメータ送信機能は削除されました
        
        # サーバーを永続的に実行
        await server.wait_closed()
    except OSError as e:
        logging.error(f"サーバー起動エラー: {e}")
        if e.errno == 98:
            logging.error(f"ポート {port} は既に使用されています。別のポートを試してください。")
        elif e.errno == 13:
            logging.error(f"ポート {port} にバインドする権限がありません。1024以上のポートを使用するか、管理者権限で実行してください。")
        sys.exit(1)
    except Exception as e:
        logging.error(f"予期しないエラーが発生しました: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # コマンドライン引数の解析
    parser = argparse.ArgumentParser(description="Shader-Tyoimaru WebSocket Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"ホスト名またはIPアドレス (デフォルト: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"ポート番号 (デフォルト: {DEFAULT_PORT})")
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        logging.info("サーバーを終了します")
