"""Turn the handmade mask photos into small, creepy pixel-art sprites.

Usage: py -3 tools/make_masks.py ref art

The photos live in ref/ (never published, they have real people in them).
Each mask is cut out along a hand-traced outline, shrunk down, given a
limited palette and a dark rim, and saved as a PNG in art/.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

REF, OUT = sys.argv[1], sys.argv[2]

# Outlines traced by hand on the full-size photos (pixel coordinates).
MASKS = {
    'ozzie': {
        'photo': 'opossum.jpg', 'width': 70, 'colors': 16,
        'shapes': [
            [(130, 420), (108, 330), (160, 272), (250, 262), (310, 300), (350, 382), (450, 386), (600, 390),
             (660, 402), (720, 372), (820, 366), (892, 402), (912, 470), (862, 540), (842, 620), (772, 720),
             (692, 820), (632, 900), (592, 1000), (542, 1052), (470, 1056), (410, 1012), (390, 952), (330, 882),
             (230, 822), (160, 722), (140, 600)],
        ],
        'black': [],
    },
    'jeffery': {
        'photo': 'moth.jpg', 'width': 92, 'colors': 16,
        'shapes': [
            # left wing
            [(0, 67), (217, 0), (330, 0), (420, 250), (408, 292), (317, 308), (100, 200), (0, 158)],
            # right wing
            [(745, 330), (900, 180), (1080, 90), (1080, 450), (933, 442), (783, 383)],
            # fur ruff
            [(67, 483), (283, 450), (283, 783), (133, 700)],
            [(717, 667), (867, 633), (850, 867), (733, 900)],
            # face
            [(430, 265), (560, 258), (680, 290), (760, 360), (810, 450), (825, 560), (810, 680), (760, 780),
             (680, 860), (560, 915), (450, 915), (380, 860), (310, 760), (280, 640), (280, 520), (300, 420),
             (350, 330)],
        ],
        # the eye holes: pitch black, so you never see who's behind the mask
        'black': [(392, 525, 78, 94), (658, 567, 102, 94)],
    },
}


def build(name, cfg):
    photo = Image.open(f"{REF}/{cfg['photo']}").convert('RGB')
    alpha = Image.new('L', photo.size, 0)
    d = ImageDraw.Draw(alpha)
    for shape in cfg['shapes']:
        d.polygon(shape, fill=255)
    for (cx, cy, rx, ry) in cfg.get('ellipses', []):
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    img = photo.copy()
    dd = ImageDraw.Draw(img)
    for (cx, cy, rx, ry) in cfg['black']:
        dd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(8, 6, 12))

    box = alpha.getbbox()
    img, alpha = img.crop(box), alpha.crop(box)

    # moodier: a bit less colour, more contrast, lit from above so the bottom sinks into shadow
    img = ImageEnhance.Color(img).enhance(0.8)
    img = ImageEnhance.Contrast(img).enhance(1.25)
    shade = Image.linear_gradient('L').resize(img.size)          # 0 at top -> 255 at bottom
    dark = Image.new('RGB', img.size, (20, 14, 34))
    img = Image.composite(dark, img, shade.point(lambda v: int(v * 0.45)))

    w = cfg['width']
    h = round(img.height * w / img.width)
    small = img.resize((w, h), Image.LANCZOS)
    small_a = alpha.resize((w, h), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)
    small = small.quantize(colors=cfg['colors'], dither=Image.Dither.NONE).convert('RGB')

    # dark rim around the cut-out, so it reads clearly against the night
    out = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    rim = small_a.filter(ImageFilter.MaxFilter(3))
    big_a = Image.new('L', out.size, 0)
    big_a.paste(rim, (1, 1))
    rim_layer = Image.new('RGBA', out.size, (14, 10, 22, 255))
    out = Image.composite(rim_layer, out, big_a)
    face = Image.new('RGBA', out.size, (0, 0, 0, 0))
    face.paste(small, (1, 1), small_a)
    out.alpha_composite(face)
    out.save(f'{OUT}/{name}.png')
    return out


if __name__ == '__main__':
    import os
    os.makedirs(OUT, exist_ok=True)
    sheet = Image.new('RGBA', (420, 160), (24, 20, 34, 255))
    x = 4
    for name, cfg in MASKS.items():
        m = build(name + '_photo', cfg)
        sheet.alpha_composite(m, (x, 4))
        x += m.width + 8
        print(name, m.size)
    sheet = sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST)
    sheet.save(f'{OUT}/_preview.png')
