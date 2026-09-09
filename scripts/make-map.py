#!/usr/bin/env python3
"""Regenerate public/villa-map.jpg, the static map on the homepage Location card.

Run from the repo root:  python3 scripts/make-map.py
Requires Pillow.  Update LAT/LON below if the property moves.

We ship a pre-rendered image rather than a live embed because OpenStreetMap's
iframe embed now requires WebGL, which fails on blocklisted GPUs. Tiles are
fetched once here, never by the visitor. Attribution is rendered on the card.
"""
import math, time, urllib.request, io, sys
from PIL import Image

LAT, LON, Z = 12.8892951, 74.8298580, 16
W, H = 1600, 960
UA = "Villa19-BuildAsset/1.0 (one-off static map generation; contact hello@habbaa.in)"

n = 2 ** Z
xt = (LON + 180.0) / 360.0 * n
yt = (1.0 - math.asinh(math.tan(math.radians(LAT))) / math.pi) / 2.0 * n
cpx, cpy = xt * 256, yt * 256
left, top = cpx - W / 2, cpy - H / 2

x0, x1 = math.floor(left / 256), math.floor((left + W) / 256)
y0, y1 = math.floor(top / 256), math.floor((top + H) / 256)
canvas = Image.new("RGB", (W, H), (233, 229, 220))

count = 0
for tx in range(x0, x1 + 1):
    for ty in range(y0, y1 + 1):
        url = f"https://tile.openstreetmap.org/{Z}/{tx}/{ty}.png"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            data = urllib.request.urlopen(req, timeout=20).read()
            canvas.paste(Image.open(io.BytesIO(data)).convert("RGB"),
                         (int(tx * 256 - left), int(ty * 256 - top)))
            count += 1
        except Exception as e:
            print("skip", tx, ty, e, file=sys.stderr)
        time.sleep(0.06)

canvas.save("public/villa-map.jpg", "JPEG", quality=82, optimize=True)
print(f"tiles={count} -> public/villa-map.jpg {canvas.size}")
