"""Рисует иконки приложения: тёмный квадрат с кремовой буквой «И». Запуск: python3 build/make-icons.py"""
from PIL import Image, ImageDraw, ImageFont
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)
BG, FG, ACC = (43, 38, 48), (245, 239, 228), (163, 48, 78)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

def make(size, rounded, glyph_scale):
    S = size * 4
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, S, S], fill=BG)
    f = ImageFont.truetype(FONT, int(S * glyph_scale))
    bb = d.textbbox((0, 0), 'И', font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    x, y = (S - w) / 2 - bb[0], (S - h) / 2 - bb[1] - S * 0.02
    d.text((x, y), 'И', font=f, fill=FG)
    d.rectangle([S * 0.30, S * 0.80, S * 0.70, S * 0.80 + S * 0.022], fill=ACC)
    return im.resize((size, size), Image.LANCZOS)

make(192, True, 0.56).save(f'{OUT}/icon-192.png')
make(512, True, 0.56).save(f'{OUT}/icon-512.png')
make(512, False, 0.44).save(f'{OUT}/icon-maskable-512.png')  # безопасная зона для круглых масок
make(180, False, 0.52).convert('RGB').save(f'{OUT}/apple-touch-icon.png')  # iOS сам скругляет углы
print('ok')
