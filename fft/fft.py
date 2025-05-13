import numpy as np
from PIL import Image

def compute_fft_coeffs(image_path, num_coeffs=None):
    """
    1. 画像をグレースケールで読み込み
    2. 2D FFT を実行
    3. 振幅スペクトルと位相スペクトルを取得
    4. 大きい振幅から上位 num_coeffs 個（省略時は全て）を抽出
    5. 各成分の (kx, ky), amplitude, phase を返す
    """
    # 画像を読み込み、グレースケール → float32 の numpy 配列
    img = Image.open(image_path).convert('L')
    f = np.array(img, dtype=np.float32)
    h, w = f.shape

    # 2D FFT
    F = np.fft.fft2(f)
    F_shift = np.fft.fftshift(F)

    # 周波数軸の生成
    kx = np.fft.fftshift(np.fft.fftfreq(w))  # 横方向周波数
    ky = np.fft.fftshift(np.fft.fftfreq(h))  # 縦方向周波数
    KX, KY = np.meshgrid(kx, ky)

    # 振幅と位相
    amplitude = np.abs(F_shift) / (h * w)   # 正規化
    phase     = np.angle(F_shift)

    # フラット化してソート（振幅が大きい順）
    amps_flat  = amplitude.flatten()
    phs_flat   = phase.flatten()
    kx_flat    = KX.flatten()
    ky_flat    = KY.flatten()
    idx_sorted = np.argsort(amps_flat)[::-1]

    # 抽出数を指定
    if num_coeffs is not None:
        idx_sorted = idx_sorted[:num_coeffs]

    # 上位成分をリスト化
    coeffs = []
    for idx in idx_sorted:
        coeffs.append({
            'kx': float(kx_flat[idx]),
            'ky': float(ky_flat[idx]),
            'amplitude': float(amps_flat[idx]),
            'phase': float(phs_flat[idx])
        })

    return {
        'shape': (h, w),
        'coeffs': coeffs
    }

import json
# サンプル実行
if __name__ == '__main__':
    N_COEFFS = 1000000
    print(f"{N_COEFFS=}")
    result = compute_fft_coeffs('./image.png', num_coeffs=N_COEFFS)
    data = {
        'shape': result['shape'],   # [height, width]
        'list': result['coeffs']    # {kx, ky, amplitude, phase} のリスト
    }

    # JSON ファイルに保存
    with open('coeffs.json', 'w') as fp:
        json.dump(data, fp, indent=2)
    print("coeffs.json に保存しました。")

    print(f"Image size: {result['shape'][0]}×{result['shape'][1]}")
    print("Top 5 frequency components:")
    for comp in result['coeffs'][:5]:
        print(comp)
