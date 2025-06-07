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

// 2D Simplex Noise風の関数（スムーズなバージョン）
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // 四隅の乱数値
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    // より滑らかな補間関数（三次エルミート曲線）
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 3D Noise関数（より滑らかなバージョン）
float smoothNoise3D(vec3 p) {
    float xy = smoothNoise(p.xy + vec2(p.z * 0.7));
    float yz = smoothNoise(p.yz + vec2(p.x * 0.7));
    float zx = smoothNoise(p.zx + vec2(p.y * 0.7));
    float xyz = smoothNoise(p.xy + vec2(p.z * 0.3));
    return (xy + yz + zx + xyz) * 0.25;
}

// フラクタルノイズ（より滑らかなバージョン）
float smoothFractalNoise(vec3 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;
    
    // 複数のノイズレイヤーを重ね合わせる（オクターブ数を減らして滑らかに）
    for (int i = 0; i < 3; i++) {
        value += amplitude * smoothNoise3D(p * frequency);
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
    
    // ノイズを使って不規則な変形を適用（より滑らかに）
    float noiseScale = 0.8; // ノイズのスケールを調整（小さくして滑らかに）
    float timeScale = 0.2; // 時間の進行速度
    float distortionAmount = 0.6; // 変形の強さ（角を減らすために少し弱める）
    
    // 時間とともに変化するノイズ値を計算（滑らかなフラクタルノイズを使用）
    float noiseValue = smoothFractalNoise(direction * noiseScale + vec3(uTime * timeScale));
    
    // 基本の半径（球体）
    float baseRadius = 1.0;
    
    // ノイズに基づいて半径を変化させる（より滑らかな変化に）
    // sinを使って値を-1から1の間に滑らかに変化させる
    float smoothedNoise = sin(noiseValue * 3.14159) * 0.5 + 0.5;
    float radius = baseRadius * (1.0 + distortionAmount * smoothedNoise);
    
    // 二次的な変形を追加（より滑らかな形状に）
    float secondaryNoise = smoothFractalNoise(direction * noiseScale * 1.5 + vec3(uTime * timeScale * 1.2));
    // sinを使って滑らかな変化を追加
    radius += 0.2 * sin(secondaryNoise * 6.28318); // 滑らかな変形を追加
    
    // 特定の方向に緩やかな膨らみを作る（角のない滑らかな突起）
    vec3 bumpDirection = vec3(sin(uTime * 0.15), cos(uTime * 0.2), sin(uTime * 0.18));
    // cosを使って滑らかな変化を作る
    float bumpFactor = 0.25 * pow(max(0.0, dot(normalize(direction), normalize(bumpDirection))), 2.0);
    radius += bumpFactor;
    
    // 変形した位置を計算
    vec3 distortedPosition = direction * radius;
    
    // 法線ベクトルを計算（より滑らかな表面のために）
    // 微小な変位を使用
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
    
    // 近傍点でのノイズ値を計算（滑らかなノイズを使用）
    float noiseX = smoothFractalNoise(nearbyX * noiseScale + vec3(uTime * timeScale));
    float noiseY = smoothFractalNoise(nearbyY * noiseScale + vec3(uTime * timeScale));
    
    // 近傍点での半径を計算（滑らかな変化を使用）
    float smoothedNoiseX = sin(noiseX * 3.14159) * 0.5 + 0.5;
    float smoothedNoiseY = sin(noiseY * 3.14159) * 0.5 + 0.5;
    float radiusX = baseRadius * (1.0 + distortionAmount * smoothedNoiseX);
    float radiusY = baseRadius * (1.0 + distortionAmount * smoothedNoiseY);
    
    // 二次的な変形を近傍点にも適用
    float secondaryNoiseX = smoothFractalNoise(nearbyX * noiseScale * 1.5 + vec3(uTime * timeScale * 1.2));
    float secondaryNoiseY = smoothFractalNoise(nearbyY * noiseScale * 1.5 + vec3(uTime * timeScale * 1.2));
    radiusX += 0.2 * sin(secondaryNoiseX * 6.28318);
    radiusY += 0.2 * sin(secondaryNoiseY * 6.28318);
    
    // 膨らみを近傍点にも適用
    float bumpFactorX = 0.25 * pow(max(0.0, dot(normalize(nearbyX), normalize(bumpDirection))), 2.0);
    float bumpFactorY = 0.25 * pow(max(0.0, dot(normalize(nearbyY), normalize(bumpDirection))), 2.0);
    radiusX += bumpFactorX;
    radiusY += bumpFactorY;
    
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
