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

// 複数の円を重ね合わせたような形状を作る関数
float overlappingCircles(vec3 direction, float time) {
    // 円の中心位置と半径を格納する配列
    vec3 centers[10];
    float radii[10];
    
    // 最大10個の円を定義（実際に使用する数はuCircleCountで制御）
    centers[0] = normalize(vec3(sin(time * 0.1), cos(time * 0.15), sin(time * 0.12)));
    centers[1] = normalize(vec3(cos(time * 0.11), sin(time * 0.13), cos(time * 0.1)));
    centers[2] = normalize(vec3(sin(time * 0.12 + 2.0), cos(time * 0.1 + 1.0), sin(time * 0.14)));
    centers[3] = normalize(vec3(cos(time * 0.13 + 3.0), sin(time * 0.12 + 2.0), cos(time * 0.11)));
    centers[4] = normalize(vec3(sin(time * 0.14 + 4.0), cos(time * 0.13 + 3.0), sin(time * 0.15)));
    centers[5] = normalize(vec3(cos(time * 0.15 + 5.0), sin(time * 0.14 + 4.0), cos(time * 0.13)));
    centers[6] = normalize(vec3(sin(time * 0.16 + 6.0), cos(time * 0.15 + 5.0), sin(time * 0.14)));
    centers[7] = normalize(vec3(cos(time * 0.17 + 7.0), sin(time * 0.16 + 6.0), cos(time * 0.15)));
    centers[8] = normalize(vec3(sin(time * 0.18 + 8.0), cos(time * 0.17 + 7.0), sin(time * 0.16)));
    centers[9] = normalize(vec3(cos(time * 0.19 + 9.0), sin(time * 0.18 + 8.0), cos(time * 0.17)));
    
    // 各円の半径（少し変化させる）
    radii[0] = 0.7 + 0.1 * sin(time * 0.2);
    radii[1] = 0.65 + 0.1 * cos(time * 0.25);
    radii[2] = 0.75 + 0.1 * sin(time * 0.22);
    radii[3] = 0.7 + 0.1 * cos(time * 0.18);
    radii[4] = 0.68 + 0.1 * sin(time * 0.23);
    radii[5] = 0.72 + 0.1 * cos(time * 0.21);
    radii[6] = 0.71 + 0.1 * sin(time * 0.24);
    radii[7] = 0.69 + 0.1 * cos(time * 0.19);
    radii[8] = 0.73 + 0.1 * sin(time * 0.26);
    radii[9] = 0.67 + 0.1 * cos(time * 0.27);
    
    // 各円からの影響を計算
    float result = 0.0;
    float maxCircles = 10.0;
    float circleCount = clamp(uCircleCount, 1.0, maxCircles); // floatで円の数を制限
    
    // 円の数だけループ
    for (int i = 0; i < 10; i++) {
        // 現在のインデックスが使用する円の数より小さい場合のみ処理
        if (float(i) < circleCount) {
            // 方向ベクトルと円の中心とのドット積（-1から1の範囲）
            float dotProduct = dot(direction, centers[i]);
            
            // ドット積を0から1の範囲に変換し、円の影響を計算
            // 1に近いほど円の中心に近い
            float influence = 0.5 + 0.5 * dotProduct;
            
            // 円の影響を半径に基づいて調整（滑らかな減衰）
            // 中心から離れるほど影響が小さくなる
            // uCornerSharpnessが小さいほど丸く、大きいほど尖る
            influence = pow(influence, uCornerSharpness);
            
            // 複数の円の影響を合成（最大値を取る）
            result = max(result, influence * radii[i]);
        }
    }
    
    return result * 1.8; // 全体的なスケールを調整
}

void main() {
    // 元の頂点位置を取得
    vec3 position = aPosition;
    
    // 頂点の方向ベクトル（正規化）
    vec3 direction = normalize(position);
    
    // 基本の半径（球体）
    float baseRadius = 1.0;
    
    // 時間スケールを適用
    float scaledTime = uTime * uTimeScale;
    
    // 複数の円を重ね合わせた形状を作る
    float circlesRadius = overlappingCircles(direction, scaledTime);
    
    // ノイズを使って不規則な変形を適用（より滑らかに）
    float noiseScale = 0.8; // ノイズのスケール
    float timeScale = 0.15 * uTimeScale; // 時間の進行速度
    float distortionAmount = uNoiseAmount; // 変形の強さ（パラメータ化）
    
    // 時間とともに変化するノイズ値を計算（滑らかなフラクタルノイズを使用）
    float noiseValue = smoothFractalNoise(direction * noiseScale + vec3(scaledTime * timeScale));
    
    // ノイズに基づいて半径を変化させる（より滑らかな変化に）
    float smoothedNoise = sin(noiseValue * 3.14159) * 0.5 + 0.5;
    
    // 円の形状にノイズを加える
    float radius = circlesRadius * (1.0 + distortionAmount * smoothedNoise);
    
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
    
    // 近傍点での円の形状を計算
    float circlesRadiusX = overlappingCircles(nearbyX, scaledTime);
    float circlesRadiusY = overlappingCircles(nearbyY, scaledTime);
    
    // 近傍点でのノイズ値を計算
    float noiseX = smoothFractalNoise(nearbyX * noiseScale + vec3(scaledTime * timeScale));
    float noiseY = smoothFractalNoise(nearbyY * noiseScale + vec3(scaledTime * timeScale));
    
    // 近傍点での半径を計算
    float smoothedNoiseX = sin(noiseX * 3.14159) * 0.5 + 0.5;
    float smoothedNoiseY = sin(noiseY * 3.14159) * 0.5 + 0.5;
    float radiusX = circlesRadiusX * (1.0 + distortionAmount * smoothedNoiseX);
    float radiusY = circlesRadiusY * (1.0 + distortionAmount * smoothedNoiseY);
    
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
