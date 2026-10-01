#!/usr/bin/env python3
"""Cuts the readable preview of each concept page's opening from the page's own zoom tiles.

The gallery cards used to show a whole page shrunk to about 160 px wide, where body text measured under 2 px.
These previews are crops of the same pages, with the headline at a size a visitor can read.
Nothing is redrawn: each output is a window of the published tiles, resized.

  python3 tools/make_previews.py        (needs Pillow)

Each window is (x, y, width) in page pixels; the height follows from the 4:3 frame.
"""
import json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = (720, 540)
PREVIEWS = [  # page index, output name, (x, y, width)
    (0, "ax-saint-john-preview", (40, 180, 960)),
    (1, "cambridge-dacmagic-preview", (250, 158, 900)),
    (2, "cambridge-content-engine-preview", (60, 490, 1240)),
    (3, "gordon-murray-t33-preview", (70, 85, 1260)),
    (4, "rega-planar-3rs-preview", (80, 180, 1280)),
]

def main():
    html = open("index.html", encoding="utf-8").read()
    dz = json.loads(re.search(r'<script id="dz-data"[^>]*>(.*?)</script>', html, re.S).group(1))
    for i, name, (x, y, w) in PREVIEWS:
        seg = dz[i]["segs"][0]
        h = round(w * OUT[1] / OUT[0])
        page = Image.new("RGB", (seg["w"], min(seg["h"], y + h + 10)), "white")
        for t in seg["tiles"]:
            if t["y"] >= page.height:
                continue
            tile = Image.open(f"images/concepts/tiles/{t['k']}.webp").convert("RGB")
            if tile.width != seg["w"]:
                tile = tile.resize((seg["w"], round(tile.height * seg["w"] / tile.width)), Image.LANCZOS)
            page.paste(tile, (0, t["y"]))
        crop = page.crop((x, y, x + w, y + h)).resize(OUT, Image.LANCZOS)
        path = f"images/concepts/{name}.webp"
        crop.save(path, "WEBP", quality=82, method=6)
        print(f"{path}: {os.path.getsize(path) // 1024} KB, window {w}x{h} at ({x},{y}), scale {OUT[0] / w:.2f}")

if __name__ == "__main__":
    main()
