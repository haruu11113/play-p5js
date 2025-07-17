precision mediump float;

// 頂点の位置と法線ベクトルを受け取る属性
attribute vec3 aPosition;
attribute vec3 aNormal;

// モデルビュー行列、投影行列、法線行列を受け取るユニフォーム
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform float uTime; // 時間を受け取るユニフォーム

// フラグメントシェーダーに渡すための変数
varying vec3 vNormal;

// 乱数生成関数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Simplex Noise風の関数
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // 四隅の乱数値
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    // スムーズな補間
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 3D Noise関数（2Dノイズを組み合わせて疑似的に3Dに）
float noise3D(vec3 p) {
    float xy = noise(p.xy + vec2(p.z * 0.7));
    float yz = noise(p.yz + vec2(p.x * 0.7));
    float zx = noise(p.zx + vec2(p.y * 0.7));
    float xyz = noise(p.xy + vec2(p.z * 0.3));
    return (xy + yz + zx + xyz) * 0.25;
}

// フラクタルノイズ（複数のノイズを重ね合わせる）
float fractalNoise(vec3 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;
    
    // 複数のノイズレイヤーを重ね合わせる
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise3D(p * frequency);
        total += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / total;
}

void main() {
    // 元の頂点位置を取得
    vec3 position = aPosition;
    
    // 頂点の方向ベクトル（正規化）
    vec3 direction = normalize(position);
    
    // ノイズを使って不規則な変形を適用
    float noiseScale = 1.2; // ノイズのスケールを増加
    float timeScale = 0.3; // 時間の進行速度を少し上げる
    float distortionAmount = 0.7; // 変形の強さを大幅に増加
    
    // 時間とともに変化するノイズ値を計算（フラクタルノイズを使用）
    float noiseValue = fractalNoise(direction * noiseScale + vec3(uTime * timeScale));
    
    // 基本の半径（球体）
    float baseRadius = 1.0;
    
    // ノイズに基づいて半径を変化させる（より極端な変化）
    float radius = baseRadius * (1.0 + distortionAmount * noiseValue);
    
    // 二次的な変形を追加（より複雑な形状に）
    float secondaryNoise = fractalNoise(direction * noiseScale * 2.0 + vec3(uTime * timeScale * 1.5));
    radius += 0.3 * sin(secondaryNoise * 10.0); // 高周波の変形を追加
    
    // 特定の方向に突起を作る
    vec3 bumpDirection = vec3(sin(uTime * 0.2), cos(uTime * 0.3), sin(uTime * 0.25));
    float bumpFactor = 0.3 * max(0.0, dot(normalize(direction), normalize(bumpDirection)));
    radius += bumpFactor;
    
    // 変形した位置を計算
    vec3 distortedPosition = direction * radius;
    
    // 法線ベクトルを計算（近似的に）
    // より正確な法線計算のために、微小な変位を使用
    float epsilon = 0.01;
    vec3 tangentX = vec3(1.0, 0.0, 0.0);
    vec3 tangentY = vec3(0.0, 1.0, 0.0);
    
    // 方向ベクトルに直交する接線を計算
    if (abs(dot(direction, tangentX)) > 0.99) {
        tangentX = vec3(0.0, 1.0, 0.0);
        tangentY = vec3(0.0, 0.0, 1.0);
    } else {
        tangentX = normalize(cross(direction, vec3(0.0, 1.0, 0.0)));
        tangentY = normalize(cross(direction, tangentX));
    }
    
    // 微小変位を使って接線方向の点を計算
    vec3 nearbyX = normalize(direction + epsilon * tangentX);
    vec3 nearbyY = normalize(direction + epsilon * tangentY);
    
    // 近傍点でのノイズ値を計算
    float noiseX = fractalNoise(nearbyX * noiseScale + vec3(uTime * timeScale));
    float noiseY = fractalNoise(nearbyY * noiseScale + vec3(uTime * timeScale));
    
    // 近傍点での半径を計算
    float radiusX = baseRadius * (1.0 + distortionAmount * noiseX);
    float radiusY = baseRadius * (1.0 + distortionAmount * noiseY);
    
    // 近傍点の位置を計算
    vec3 posX = nearbyX * radiusX;
    vec3 posY = nearbyY * radiusY;
    
    // 接線ベクトルを計算
    vec3 tangentVecX = posX - distortedPosition;
    vec3 tangentVecY = posY - distortedPosition;
    
    // 法線ベクトルを接線ベクトルの外積として計算
    vec3 normal = normalize(cross(tangentVecX, tangentVecY));
    
    // 法線ベクトルを正規化してvNormalに代入
    vNormal = normalize(uNormalMatrix * normal);
    
    // 変形した頂点の位置を計算してgl_Positionに代入
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(distortedPosition, 1.0);
}
