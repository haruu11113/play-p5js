const WebSocket = require('ws');
const dgram = require('dgram');

// WebSocketサーバー設定
const WS_PORT = 8080;
const UDP_PORT = 6666;

// デバッグモード設定（コマンドライン引数で制御）
const DEBUG_MODE = process.argv.includes('--debug') || process.argv.includes('-d');

if (DEBUG_MODE) {
    console.log('🐛 DEBUG MODE ENABLED');
    console.log('   All received UDP data will be printed to console');
}

// WebSocketサーバーを作成
const wss = new WebSocket.Server({ port: WS_PORT });

// UDPソケットを作成
const udpSocket = dgram.createSocket('udp4');

// 接続されたクライアント一覧
const clients = new Set();

// WebSocket接続処理
wss.on('connection', (ws) => {
    if (DEBUG_MODE) {
        console.log('WebSocket client connected');
    }
    clients.add(ws);
    
    // クライアント切断時の処理
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

// センサーデータをパースする関数
function parseSensorData(rawMessage) {
    // まずJSONとして試行
    try {
        return JSON.parse(rawMessage);
    } catch (jsonError) {
        // JSON失敗時はCSV形式として解析
        if (rawMessage.includes(',')) {
            const parts = rawMessage.split(',');
            
            // "user-acc,-0.127,-0.055,0.975" のような形式を解析
            if (parts.length >= 4 && parts[0].includes('acc')) {
                return {
                    type: parts[0],
                    x: parseFloat(parts[1]) || 0,
                    y: parseFloat(parts[2]) || 0,
                    z: parseFloat(parts[3]) || 0,
                    timestamp: Date.now()
                };
            }
            
            // 他のセンサータイプ用の汎用パース
            if (parts.length >= 2) {
                const sensorType = parts[0];
                const values = parts.slice(1).map(v => parseFloat(v) || 0);
                
                const result = { type: sensorType, timestamp: Date.now() };
                
                // 値の数に応じて適切なプロパティ名を設定
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
                
                // 追加の値があれば intensity として格納
                if (values.length > 3) {
                    result.intensity = values[3];
                }
                
                return result;
            }
        }
        
        // CSVでもない場合はエラーを投げる
        throw new Error('Unknown data format');
    }
}

// UDPメッセージ受信処理
udpSocket.on('message', (msg, rinfo) => {
    const rawMessage = msg.toString().trim(); // 前後の空白を除去
    
    if (DEBUG_MODE) {
        console.log('🔍 RAW UDP DATA:');
        console.log(`   From: ${rinfo.address}:${rinfo.port}`);
        console.log(`   Length: ${msg.length} bytes`);
        console.log(`   Raw: "${rawMessage}"`);
        console.log(`   Hex: ${msg.toString('hex')}`);
    }
    
    try {
        // センサーデータをパース（JSON or CSV）
        const sensorData = parseSensorData(rawMessage);
        
        if (DEBUG_MODE) {
            console.log('✅ PARSED SENSOR DATA:');
            console.log('   ', JSON.stringify(sensorData, null, 2));
        }
        
        // 全てのWebSocketクライアントにデータを送信
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(sensorData));
            }
        });
        
        if (DEBUG_MODE) {
            console.log(`📤 Sent to ${clients.size} WebSocket client(s)`);
            console.log('---');
        }
        
    } catch (error) {
        if (DEBUG_MODE) {
            console.error('❌ ERROR parsing UDP message:', error.message);
            console.log('📄 Raw message was:', rawMessage);
        }
        
        if (DEBUG_MODE) {
            console.log('🔍 Attempting to parse as different formats...');
            
            // Try parsing as CSV
            if (rawMessage.includes(',')) {
                const csvParts = rawMessage.split(',');
                console.log('   CSV parts:', csvParts);
                console.log('   Parts count:', csvParts.length);
                
                csvParts.forEach((part, index) => {
                    const parsed = parseFloat(part);
                    console.log(`   [${index}]: "${part}" -> ${isNaN(parsed) ? 'NaN' : parsed}`);
                });
            }
            
            // Try parsing as space-separated values
            if (rawMessage.includes(' ')) {
                console.log('   Space-separated:', rawMessage.split(' '));
            }
            
            // Check for non-printable characters
            const nonPrintable = rawMessage.match(/[^\x20-\x7E]/g);
            if (nonPrintable) {
                console.log('   Contains non-printable chars:', nonPrintable);
            }
        }
    }
});

// UDPソケットエラー処理
udpSocket.on('error', (err) => {
    console.error('UDP socket error:', err);
});

// UDPポートをバインド
udpSocket.bind(UDP_PORT, () => {
    if (DEBUG_MODE) {
        console.log(`UDP server listening on port ${UDP_PORT}`);
    }
});

if (DEBUG_MODE) {
    console.log(`🌐 WebSocket server running on port ${WS_PORT}`);
    console.log(`📡 UDP server listening on port ${UDP_PORT}`);
    console.log('⏳ Waiting for UDP sensor data...');
}

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
    console.log('\nClosing servers...');
    udpSocket.close();
    wss.close();
    process.exit(0);
});