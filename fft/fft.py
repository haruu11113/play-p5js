import numpy as np
from PIL import Image
import json

def compute_fft_coeffs_gray(f, num_coeffs):
    """入力 f: 2D numpy(float32) → 上位 num_coeffs 成分を返す"""
    h, w = f.shape
    F     = np.fft.fft2(f)
    F2    = np.fft.fftshift(F)
    kx    = np.fft.fftshift(np.fft.fftfreq(w))
    ky    = np.fft.fftshift(np.fft.fftfreq(h))
    KX, KY= np.meshgrid(kx, ky)

    amp   = np.abs(F2) / (h * w)
    ph    = np.angle(F2)

    flat_amp  = amp.flatten()
    flat_ph   = ph.flatten()
    flat_kx   = KX.flatten()
    flat_ky   = KY.flatten()

    idxs = np.argsort(flat_amp)[::-1]
    if num_coeffs:
        idxs = idxs[:num_coeffs]

    coeffs = []
    for i in idxs:
        coeffs.append({
            'kx': float(flat_kx[i]),
            'ky': float(flat_ky[i]),
            'amplitude': float(flat_amp[i]),
            'phase': float(flat_ph[i])
        })
    return coeffs

def compute_fft_coeffs_color(image_path, num_coeffs=None):
    """
    1. 画像をRGBで読み込み
    2. 各チャンネルごとに FFT → 上位 num_coeffs を抽出
    3. JSON 用 dict で返す
    """
    img = Image.open(image_path).convert('RGB')
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape

    # 各チャンネル分
    coeffs_r = compute_fft_coeffs_gray(arr[:, :, 0], num_coeffs)
    coeffs_g = compute_fft_coeffs_gray(arr[:, :, 1], num_coeffs)
    coeffs_b = compute_fft_coeffs_gray(arr[:, :, 2], num_coeffs)

    return {
        'shape': [h, w],
        'r': coeffs_r,
        'g': coeffs_g,
        'b': coeffs_b
    }

if __name__ == '__main__':
    IMAGE_PATH = './image.png'
    N_COEFFS    = 10000  # お好みで増減
    out = compute_fft_coeffs_color(IMAGE_PATH, num_coeffs=N_COEFFS)

    # JSON ファイルに保存
    with open('coeffs_color.json', 'w') as fp:
        json.dump(out, fp, indent=2)

    print(f"coeffs_color.json に保存しました: {out['shape'][0]}×{out['shape'][1]}, 各チャンネル {N_COEFFS} 成分ずつ")
