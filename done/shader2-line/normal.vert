precision mediump float;

// 頂点の位置と法線ベクトルを受け取る属性
attribute vec3 aPosition;
attribute vec3 aNormal;

// モデルビュー行列、投影行列、法線行列を受け取るユニフォーム
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform float uTime; // 時間を受け取るユニフォーム

// パラメータ用のユニフォーム変数
uniform float uCircleCount; // 円の数（1〜10）- floatに変更
uniform float uCornerSharpness; // 角の鋭さ（0.5〜3.0、小さいほど丸く、大きいほど尖る）
uniform float uNoiseAmount; // ノイズの強さ（0.0〜1.0）
uniform float uTimeScale; // 時間スケール（アニメーション速度、0.1〜2.0）

// フラグメントシェーダーに渡すための変数
varying vec3 vNormal;
varying vec3 vPosition; // 頂点位置をフラグメントシェーダーに渡す

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

// 泡のような形状を作る関数
float bubbleShape(vec3 direction, float time) {
    // 基本的な球形
    float baseRadius = 1.0;
    
    // 小さな変形を加える（より複雑な形状のための歪み）
    float deformation = 0.0;
    
    // 複数の周波数の正弦波を使って自然な変形を作る（周波数を増やして複雑に）
    for (int i = 1; i <= 5; i++) {
        float freq = float(i) * 2.5;
        float amp = 0.04 / float(i); // 高周波ほど振幅を小さく
        
        // 各軸方向の変形（より複雑なパターン）
        deformation += amp * sin(direction.x * freq + time * 0.3);
        deformation += amp * sin(direction.y * freq + time * 0.4);
        deformation += amp * sin(direction.z * freq + time * 0.5);
        
        // 対角線方向の変形を追加（より有機的な形状に）
        deformation += amp * 0.5 * sin((direction.x + direction.y) * freq * 0.7 + time * 0.25);
        deformation += amp * 0.5 * sin((direction.y + direction.z) * freq * 0.7 + time * 0.35);
        deformation += amp * 0.5 * sin((direction.z + direction.x) * freq * 0.7 + time * 0.45);
    }
    
    // 表面張力による効果（より複雑な変動を追加）
    float tension = 0.08 * sin(time * 0.2) + 0.05 * cos(time * 0.33); // 時間とともに複雑に変化
    
    // 円の中心位置を生成（時間とともにより複雑に変化）
    vec3 centers[8]; // 円の数を増やして複雑な形状に
    
    // 基本位置（より多様な動きパターン）
    centers[0] = normalize(vec3(sin(time * 0.1), cos(time * 0.15), sin(time * 0.12)));
    centers[1] = normalize(vec3(cos(time * 0.11), sin(time * 0.13), cos(time * 0.1)));
    centers[2] = normalize(vec3(sin(time * 0.12 + 2.0), cos(time * 0.1 + 1.0), sin(time * 0.14)));
    centers[3] = normalize(vec3(cos(time * 0.13 + 3.0), sin(time * 0.12 + 2.0), cos(time * 0.11)));
    centers[4] = normalize(vec3(sin(time * 0.14 + 4.0), cos(time * 0.13 + 3.0), sin(time * 0.15)));
    // 追加の円の中心（より複雑な形状のため）
    centers[5] = normalize(vec3(cos(time * 0.09 + 1.5), sin(time * 0.11 + 2.5), cos(time * 0.13 + 3.5)));
    centers[6] = normalize(vec3(sin(time * 0.15 + 5.0), cos(time * 0.14 + 4.0), sin(time * 0.16 + 3.0)));
    centers[7] = normalize(vec3(cos(time * 0.16 + 2.5), sin(time * 0.15 + 1.5), cos(time * 0.14 + 0.5)));
    
    // より複雑な変動を追加
    centers[0] += 0.15 * vec3(sin(time * 0.23), cos(time * 0.19), sin(time * 0.31));
    centers[1] += 0.15 * vec3(cos(time * 0.29), sin(time * 0.17), cos(time * 0.21));
    centers[2] += 0.15 * vec3(sin(time * 0.27), cos(time * 0.25), sin(time * 0.33));
    centers[3] += 0.15 * vec3(cos(time * 0.31), sin(time * 0.23), cos(time * 0.27));
    centers[4] += 0.15 * vec3(sin(time * 0.33), cos(time * 0.31), sin(time * 0.29));
    centers[5] += 0.15 * vec3(cos(time * 0.25), sin(time * 0.35), cos(time * 0.15));
    centers[6] += 0.15 * vec3(sin(time * 0.19), cos(time * 0.27), sin(time * 0.23));
    centers[7] += 0.15 * vec3(cos(time * 0.21), sin(time * 0.29), cos(time * 0.25));
    
    // 正規化して単位球面上に戻す
    for (int i = 0; i < 8; i++) {
        centers[i] = normalize(centers[i]);
    }
    
    // 各円の半径（より複雑な時間変化）
    float radii[8];
    radii[0] = 0.7 + 0.2 * sin(time * 0.21);
    radii[1] = 0.65 + 0.15 * cos(time * 0.19);
    radii[2] = 0.75 + 0.18 * sin(time * 0.17 + 1.0);
    radii[3] = 0.68 + 0.22 * cos(time * 0.23 + 2.0);
    radii[4] = 0.72 + 0.17 * sin(time * 0.25 + 3.0);
    // 追加の円の半径（より多様な変化パターン）
    radii[5] = 0.67 + 0.19 * sin(time * 0.22 + 1.5);
    radii[6] = 0.73 + 0.16 * cos(time * 0.18 + 2.5);
    radii[7] = 0.69 + 0.21 * sin(time * 0.24 + 3.5);
    
    // 各円の影響を計算
    float circleInfluence = 0.0;
    float blendFactor = 2.5; // ブレンド係数（小さくして滑らかに）
    float totalWeight = 0.0;
    
    // 使用する円の数（uCircleCountに基づく）
    int numCircles = int(min(8.0, max(3.0, uCircleCount)));
    
    // 各円からの距離に基づく重み付け
    for (int i = 0; i < 8; i++) {
        if (i < numCircles) {
            // 方向ベクトルと円の中心との距離
            float dist = distance(direction, centers[i]);
            
            // 円の半径に基づいて影響範囲を調整
            float radiusEffect = radii[i] * 1.5;
            
            // 距離に基づく重み（より滑らかな重み付け関数）
            float weight = radiusEffect / pow(dist + 0.4, blendFactor);
            
            // 時間に基づく重みの変調（より動的な形状変化）
            weight *= 1.0 + 0.2 * sin(time * 0.3 + float(i) * 0.5);
            
            // 重みを累積
            circleInfluence += weight;
            totalWeight += weight;
        }
    }
    
    // 正規化された影響度
    circleInfluence = circleInfluence / totalWeight;
    
    // 円の影響を半径に反映（より大きな変形効果）
    float circleEffect = 0.2 * circleInfluence;
    
    // 追加の有機的な変形（より複雑な形状のため）
    float organicDeform = 0.1 * sin(direction.x * 3.0 + direction.y * 2.0 + direction.z * 4.0 + time * 0.2);
    organicDeform += 0.08 * cos(direction.z * 5.0 + direction.x * 3.0 + time * 0.3);
    
    // 最終的な半径を計算（より複雑な組み合わせ）
    float radius = baseRadius + deformation + tension + circleEffect + organicDeform;
    
    return radius;
}

void main() {
    // 元の頂点位置を取得
    vec3 position = aPosition;
    
    // 頂点の方向ベクトル（正規化）
    vec3 direction = normalize(position);
    
    // 時間スケールを適用
    float scaledTime = uTime * uTimeScale;
    
    // 泡のような形状を作る
    float bubbleRadius = bubbleShape(direction, scaledTime);
    
    // ノイズを使って表面の微細な変形を適用
    float noiseScale = 0.8; // ノイズのスケール
    float timeScale = 0.15 * uTimeScale; // 時間の進行速度
    float distortionAmount = uNoiseAmount * 0.3; // 変形の強さを抑える（泡は比較的滑らか）
    
    // 時間とともに変化するノイズ値を計算
    float noiseValue = smoothFractalNoise(direction * noiseScale + vec3(scaledTime * timeScale));
    
    // ノイズに基づいて半径を変化させる（より滑らかな変化に）
    float smoothedNoise = sin(noiseValue * 3.14159) * 0.5 + 0.5;
    
    // 泡の形状にノイズを加える（微細な変形）
    float radius = bubbleRadius * (1.0 + distortionAmount * smoothedNoise);
    
    // 2D効果のために、Z座標を圧縮（完全に平らにはせず、わずかな奥行きを残す）
    float zScale = 0.2; // Z方向の圧縮率（小さいほど平面に近づく）
    
    // 変形した位置を計算（Z座標を圧縮）
    vec3 distortedPosition = direction * radius;
    distortedPosition.z *= zScale;
    
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
    
    // 近傍点での泡の形状を計算
    float bubbleRadiusX = bubbleShape(nearbyX, scaledTime);
    float bubbleRadiusY = bubbleShape(nearbyY, scaledTime);
    
    // 近傍点でのノイズ値を計算
    float noiseX = smoothFractalNoise(nearbyX * noiseScale + vec3(scaledTime * timeScale));
    float noiseY = smoothFractalNoise(nearbyY * noiseScale + vec3(scaledTime * timeScale));
    
    // 近傍点での半径を計算
    float smoothedNoiseX = sin(noiseX * 3.14159) * 0.5 + 0.5;
    float smoothedNoiseY = sin(noiseY * 3.14159) * 0.5 + 0.5;
    float radiusX = bubbleRadiusX * (1.0 + distortionAmount * smoothedNoiseX);
    float radiusY = bubbleRadiusY * (1.0 + distortionAmount * smoothedNoiseY);
    
    // 近傍点の位置を計算
    vec3 posX = nearbyX * radiusX;
    vec3 posY = nearbyY * radiusY;
    
    // 接線ベクトルを計算
    vec3 tangentVecX = posX - distortedPosition;
    vec3 tangentVecY = posY - distortedPosition;
    
    // 法線ベクトルを接線ベクトルの外積として計算
    vec3 normal = normalize(cross(tangentVecX, tangentVecY));
    
    // モデルビュー行列を適用した位置をフラグメントシェーダーに渡す
    vPosition = (uModelViewMatrix * vec4(distortedPosition, 1.0)).xyz;
    
    // 法線ベクトルを正規化してvNormalに代入
    vNormal = normalize(uNormalMatrix * normal);
    
    // 変形した頂点の位置を計算してgl_Positionに代入
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(distortedPosition, 1.0);
}
