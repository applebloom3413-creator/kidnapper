"""Cut a drawing out of a screenshot of a drawing app, where the transparent
background shows as a grey-and-white checkerboard, then shrink it to fit
the game with the same moody shading as the masks.

Usage: py -3 tools/cutout_drawing.py <screenshot> <out.png> <height> [top bottom]
"""
import sys
from collections import deque
from PIL import Image, ImageEnhance, ImageFilter

src, out, height = sys.argv[1], sys.argv[2], int(sys.argv[3])
top = int(sys.argv[4]) if len(sys.argv) > 4 else 146
bottom = int(sys.argv[5]) if len(sys.argv) > 5 else 838

im = Image.open(src).convert('RGB').crop((0, top, 525, bottom))
w, h = im.size
px = im.load()


def checker_like(c):
    # the two checkerboard greys (about 255 and 223), allowing for JPEG fuzz
    r, g, b = c
    if max(r, g, b) - min(r, g, b) > 10:
        return False
    v = (r + g + b) / 3
    return v >= 246 or 212 <= v <= 234


# flood fill the background in from the edges; outlines stop it reaching the fur
bg = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if checker_like(px[x, y]):
            bg[y][x] = True; q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if checker_like(px[x, y]) and not bg[y][x]:
            bg[y][x] = True; q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and checker_like(px[nx, ny]):
            bg[ny][nx] = True; q.append((nx, ny))

# second pass: anywhere the checkerboard *pattern* shows up (both greys close together
# with hard steps between them) is background too, even in pockets the fill couldn't reach.
# Smooth white fur never has that pattern, so it's safe.
gray = [[(sum(px[x, y]) / 3) if max(px[x, y]) - min(px[x, y]) <= 10 else -1 for x in range(w)] for y in range(h)]
R = 6
for y in range(h):
    for x in range(w):
        if bg[y][x] or gray[y][x] < 205:
            continue
        hi = lo = other = 0
        for yy in range(max(0, y - R), min(h, y + R + 1), 2):
            for xx in range(max(0, x - R), min(w, x + R + 1), 2):
                v = gray[yy][xx]
                if v >= 246: hi += 1
                elif 213 <= v <= 233: lo += 1
                else: other += 1
        if hi >= 6 and lo >= 6 and other <= 4:
            bg[y][x] = True

alpha = Image.new('L', (w, h), 0)
ap = alpha.load()
for y in range(h):
    for x in range(w):
        ap[x, y] = 0 if bg[y][x] else 255
# tidy stray specks at the edge
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))

box = alpha.getbbox()
im, alpha = im.crop(box), alpha.crop(box)
im.putalpha(alpha)
im.save(out.replace('.png', '_full.png'))

# shave the pale fringe left over from the checkerboard off the edges
alpha = alpha.filter(ImageFilter.MinFilter(5))
# a light touch of mood: keep her colours (a little boost so they survive shrinking),
# and just let the bottom sink a little into shadow
rgb = ImageEnhance.Color(im.convert('RGB')).enhance(1.25)
shade = Image.linear_gradient('L').resize(rgb.size)
dark = Image.new('RGB', rgb.size, (18, 12, 30))
rgb = Image.composite(dark, rgb, shade.point(lambda v: int(max(0, v - 128) * 0.45)))

nw = round(rgb.width * height / rgb.height)
small = rgb.resize((nw, height), Image.LANCZOS).quantize(colors=64, dither=Image.Dither.NONE).convert('RGB')
small_a = alpha.resize((nw, height), Image.LANCZOS).point(lambda v: 255 if v > 120 else 0)
# a thin dark rim so the edges read cleanly against the dark doorway
res = Image.new('RGBA', (nw, height), (0, 0, 0, 0))
rim = Image.new('RGBA', (nw, height), (14, 10, 22, 255))
res.paste(rim, (0, 0), small_a.filter(ImageFilter.MaxFilter(3)))
face = Image.new('RGBA', (nw, height), (0, 0, 0, 0))
face.paste(small, (0, 0), small_a)
res.alpha_composite(face)
res.save(out)
print(out, res.size, 'cut box', box)
