import json
import numpy as np
from PIL import Image

def reconstruct_channel(coeffs, shape):
    """
    Reconstruct a single channel image from its FFT coefficients.
    coeffs: list of dicts with keys 'kx', 'ky', 'amplitude', 'phase'
    shape: (h, w)
    """
    h, w = shape
    # prepare empty Fourier domain array
    F2 = np.zeros((h, w), dtype=np.complex64)

    # Build the frequency coordinate grids
    kx = np.fft.fftshift(np.fft.fftfreq(w))
    ky = np.fft.fftshift(np.fft.fftfreq(h))
    KX, KY = np.meshgrid(kx, ky)

    # For each stored coefficient, find its nearest grid point and place the complex value
    for c in coeffs:
        # find nearest indices
        ix = np.abs(kx - c['kx']).argmin()
        iy = np.abs(ky - c['ky']).argmin()
        # reconstruct complex coefficient
        amp = c['amplitude'] * (h * w)
        ph  = c['phase']
        F2[iy, ix] = amp * np.exp(1j * ph)

    # undo the fftshift
    F = np.fft.ifftshift(F2)
    # inverse 2D FFT
    f = np.fft.ifft2(F)
    # return real part, clipped to [0,255]
    f_real = np.real(f)
    f_real -= f_real.min()
    f_real /= f_real.max()
    return (f_real * 255).astype(np.uint8)

def reconstruct_image_from_json(json_path, output_path='reconstructed.png'):
    # load the JSON
    with open(json_path, 'r') as fp:
        data = json.load(fp)

    h, w = data['shape']
    # reconstruct each channel
    r = reconstruct_channel(data['r'], (h, w))
    g = reconstruct_channel(data['g'], (h, w))
    b = reconstruct_channel(data['b'], (h, w))

    # stack and save
    img = np.stack([r, g, b], axis=-1)
    Image.fromarray(img).save(output_path)
    print(f"Reconstructed image saved to {output_path}")

if __name__ == '__main__':
    reconstruct_image_from_json('coeffs_color.json', 'image_reconstructed.png')
