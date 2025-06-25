const WebSocket = require('ws');
const dgram = require('dgram');
const express = require('express');
const path = require('path');

// サーバー設定
const HTTP_PORT = 8000;
const WS_PORT = 8080;
const UDP_PORT = 6666;

// デバッグモード設定
const DEBUG_MODE = process.argv.includes('--debug') || process.argv.includes('-d');

// Express サーバー作成（静的ファイル配信用）
const app = express();
app.use(express.static(__dirname));

// HTTPサーバー起動
app.listen(HTTP_PORT, () => {
    if (DEBUG_MODE) {
        console.log(`🌐 HTTP server running on http://localhost:${HTTP_PORT}`);
    }
});

// WebSocketサーバー作成
const wss = new WebSocket.Server({ port: WS_PORT });

// UDPソケット作成
const udpSocket = dgram.createSocket('udp4');

// 接続されたクライアント一覧
const clients = new Set();

// WebSocket接続処理
wss.on('connection', (ws) => {
    if (DEBUG_MODE) {
        console.log('WebSocket client connected');
    }
    clients.add(ws);
    
    ws.on('close', () => {
        if (DEBUG_MODE) {
            console.log('WebSocket client disconnected');
        }
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        if (DEBUG_MODE) {
            console.error('WebSocket error:', error);
        }
        clients.delete(ws);
    });
});

// センサーデータパース関数（既存のものと同じ）
function parseSensorData(rawMessage) {
    try {
        return JSON.parse(rawMessage);
    } catch (jsonError) {
        if (rawMessage.includes(',')) {
            const parts = rawMessage.split(',');
            
            if (parts.length >= 4 && parts[0].includes('acc')) {
                return {
                    type: parts[0],
                    x: parseFloat(parts[1]) || 0,
                    y: parseFloat(parts[2]) || 0,
                    z: parseFloat(parts[3]) || 0,
                    timestamp: Date.now()
                };
            }
            
            if (parts.length >= 2) {
                const sensorType = parts[0];
                const values = parts.slice(1).map(v => parseFloat(v) || 0);
                
                const result = { type: sensorType, timestamp: Date.now() };
                
                if (values.length >= 3) {
                    result.x = values[0];
                    result.y = values[1];
                    result.z = values[2];
                } else if (values.length === 2) {
                    result.x = values[0];
                    result.y = values[1];
                    result.z = 0;
                } else if (values.length === 1) {
                    result.value = values[0];
                    result.x = values[0];
                    result.y = 0;
                    result.z = 0;
                }
                
                if (values.length > 3) {
                    result.intensity = values[3];
                }
                
                return result;
            }
        }
        
        throw new Error('Unknown data format');
    }
}

// UDPメッセージ受信処理
udpSocket.on('message', (msg, rinfo) => {
    const rawMessage = msg.toString().trim();
    
    if (DEBUG_MODE) {
        console.log('🔍 RAW UDP DATA:');
        console.log(`   From: ${rinfo.address}:${rinfo.port}`);
        console.log(`   Raw: "${rawMessage}"`);
    }
    
    try {
        const sensorData = parseSensorData(rawMessage);
        
        if (DEBUG_MODE) {
            console.log('✅ PARSED SENSOR DATA:', JSON.stringify(sensorData, null, 2));
        }
        
        // 全WebSocketクライアントに送信
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(sensorData));
            }
        });
        
        if (DEBUG_MODE) {
            console.log(`📤 Sent to ${clients.size} client(s)`);
        }
        
    } catch (error) {
        if (DEBUG_MODE) {
            console.error('❌ Parse error:', error.message);
            console.log('📄 Raw:', rawMessage);
        }
    }
});

// UDPポートバインド
udpSocket.bind(UDP_PORT, () => {
    if (DEBUG_MODE) {
        console.log(`📡 UDP server listening on port ${UDP_PORT}`);
        console.log(`🌐 WebSocket server running on port ${WS_PORT}`);
        console.log('⏳ Waiting for sensor data...');
    }
});

// エラーハンドリング
udpSocket.on('error', (err) => {
    console.error('UDP error:', err);
});

// 終了処理
process.on('SIGINT', () => {
    console.log('\nShutting down servers...');
    udpSocket.close();
    wss.close();
    process.exit(0);
});

console.log('🚀 Unified server started');
if (DEBUG_MODE) {
    console.log('   HTTP: http://localhost:' + HTTP_PORT);
    console.log('   WebSocket: ws://localhost:' + WS_PORT);
    console.log('   UDP: port ' + UDP_PORT);
} else {
    console.log('   Access: http://localhost:' + HTTP_PORT);
}