#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
WebSocket Client for Shader-Tyoimaru
シェーダーパラメータを送信するためのWebSocketクライアント
"""

import asyncio
import json
import logging
import argparse
import sys
import websockets

# ロギングの設定
logging.basicConfig(
    format="%(asctime)s %(message)s",
    level=logging.INFO,
)

# デフォルト設定
DEFAULT_SERVER = "localhost:8080"

async def send_parameters(server_url, params):
    """WebSocketサーバーにパラメータを送信する"""
    try:
        # パラメータの検証
        logging.info(f"送信するパラメータ: {params}")
        
        # WebSocketサーバーに接続
        logging.info(f"WebSocketサーバー {server_url} に接続しています...")
        async with websockets.connect(f"ws://{server_url}") as websocket:
            logging.info(f"WebSocketサーバー {server_url} に接続しました")
            
            # パラメータをJSONに変換して送信
            json_data = json.dumps(params)
            await websocket.send(json_data)
            logging.info(f"パラメータを送信しました: {json_data}")
            
            # サーバーからの応答を待機（オプション）
            try:
                # 2秒間だけ応答を待機
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                try:
                    # JSONとして解析を試みる
                    response_data = json.loads(response)
                    logging.info(f"サーバーからの応答 (JSON): {response_data}")
                except json.JSONDecodeError:
                    # 通常のテキストとして表示
                    logging.info(f"サーバーからの応答 (テキスト): {response}")
            except asyncio.TimeoutError:
                # タイムアウトしても問題ない（応答が必要ない場合）
                logging.info("サーバーからの応答はありませんでした（正常）")
            
            logging.info("パラメータの送信が完了しました")
            print("✅ パラメータの送信に成功しました")
            
    except websockets.exceptions.ConnectionError:
        logging.error(f"WebSocketサーバー {server_url} への接続に失敗しました")
        print(f"❌ エラー: WebSocketサーバー {server_url} への接続に失敗しました")
        print("  サーバーが起動しているか、アドレスが正しいか確認してください")
        sys.exit(1)
    except Exception as e:
        logging.error(f"エラーが発生しました: {e}")
        print(f"❌ エラー: {e}")
        sys.exit(1)

def parse_arguments():
    """コマンドライン引数の解析"""
    parser = argparse.ArgumentParser(description="Shader-Tyoimaru WebSocket Client")
    
    # サーバーURL
    parser.add_argument("--server", default=DEFAULT_SERVER, 
                        help=f"WebSocketサーバーのアドレス (デフォルト: {DEFAULT_SERVER})")
    
    # 頂点シェーダーパラメータ
    parser.add_argument("--timeScale", type=float, 
                        help="時間変化の速度 (0.05〜0.3)")
    parser.add_argument("--distortionAmount", type=float, 
                        help="歪みの強さ (0.2〜0.8)")
    parser.add_argument("--secondaryWaveAmplitude", type=float, 
                        help="二次的な波の振幅 (0.05〜0.3)")
    parser.add_argument("--bumpStrength", type=float, 
                        help="膨らみの強さ (0.1〜0.4)")
    
    # フラグメントシェーダーパラメータ
    parser.add_argument("--baseHue", type=float, 
                        help="基本色相 (0〜1)")
    parser.add_argument("--hueVariation", type=float, 
                        help="色相の変化量 (0.1〜0.5)")
    parser.add_argument("--hueTimeFactor", type=float, 
                        help="色相の時間変化量 (0.05〜0.2)")
    parser.add_argument("--timeSpeed", type=float, 
                        help="ノイズの時間変化速度 (0.1〜0.4)")
    parser.add_argument("--edgePower", type=float, 
                        help="エッジ強調の強さ (1〜4)")
    parser.add_argument("--pulseAmplitude", type=float, 
                        help="脈動の強さ (0.02〜0.1)")
    parser.add_argument("--pulseSpeed", type=float, 
                        help="脈動の速度 (1〜4)")
    
    # その他のパラメータ
    parser.add_argument("--rotationSpeed", type=float, 
                        help="回転速度 (0.01〜0.1)")
    parser.add_argument("--autoRotate", type=lambda x: (str(x).lower() == 'true'), 
                        help="自動回転のON/OFF (true/false)")
    parser.add_argument("--sphereDetail", type=int, 
                        help="球体の詳細度 (12〜1024)")
    
    # 制御コマンド
    parser.add_argument("--random", action="store_true", 
                        help="ランダムなパラメータを生成して送信")
    
    return parser.parse_args()

def generate_random_parameters():
    """ランダムなパラメータを生成（テスト用）"""
    import random
    
    def random_range(min_val, max_val):
        return min_val + random.random() * (max_val - min_val)
    
    return {
        "timeScale": random_range(0.05, 0.3),
        "distortionAmount": random_range(0.2, 0.8),
        "secondaryWaveAmplitude": random_range(0.05, 0.3),
        "bumpStrength": random_range(0.1, 0.4),
        "baseHue": random_range(0, 1),
        "hueVariation": random_range(0.1, 0.5),
        "hueTimeFactor": random_range(0.05, 0.2),
        "timeSpeed": random_range(0.1, 0.4),
        "edgePower": random_range(1, 4),
        "pulseAmplitude": random_range(0.02, 0.1),
        "pulseSpeed": random_range(1, 4),
        "rotationSpeed": random_range(0.01, 0.1)
    }

def main():
    """メイン関数"""
    args = parse_arguments()
    
    # パラメータの収集
    params = {}
    
    # ランダムパラメータの生成（--random オプションが指定された場合）
    if args.random:
        params = generate_random_parameters()
        logging.info("ランダムなパラメータを生成しました")
        print("🎲 ランダムなパラメータを生成しました")
    
    # コマンドライン引数からパラメータを追加
    for arg_name, arg_value in vars(args).items():
        if arg_name not in ["server", "random"] and arg_value is not None:
            params[arg_name] = arg_value
    
    # パラメータが指定されているか確認
    if not params:
        logging.error("パラメータが指定されていません。--help で使用方法を確認してください。")
        print("❌ エラー: パラメータが指定されていません")
        print("使用例:")
        print("  python ws_client.py --baseHue 0.3 --distortionAmount 0.6")
        print("  python ws_client.py --autoRotate false")
        print("  python ws_client.py --random")
        print("詳細なヘルプは --help オプションで確認できます")
        sys.exit(1)
    
    # サーバーアドレスの表示
    print(f"🔌 WebSocketサーバー {args.server} に接続しています...")
    
    # パラメータの送信
    asyncio.run(send_parameters(args.server, params))

if __name__ == "__main__":
    main()
