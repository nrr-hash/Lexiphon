#!/usr/bin/env python3
"""Draws the app icons for the web app manifest: a glass dial inside an amber value ring, the instrument's own motif.

Everything is drawn from code, with no fonts or stock images.
Run from the repository root:  python3 tools/make_icons.py     (needs numpy and Pillow)

Writes:
  images/icons/icon-192.png, icon-512.png     rounded square, for "any" use
  images/icons/maskable-512.png               full bleed, artwork inside the central 80% safe zone
  images/apple-touch-icon.png                 180 px, full bleed (iOS rounds the corners itself)
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 4  # supersampling


def background(n):
    y, x = np.mgrid[0:n, 0:n] / n
    base = np.zeros((n, n, 3))
    t = (x * .35 + y * .65)[..., None]
    base[:] = np.array([20, 42, 33]) * (1 - t) + np.array([8, 16, 13]) * t
    for cx, cy, col, k in ((.12, .08, (232, 131, 46), .30), (.95, .98, (90, 170, 220), .22)):
        d = np.hypot(x - cx, y - cy)[..., None]
        base += np.array(col) * np.clip(1 - d / .75, 0, 1) ** 2 * k
    return Image.fromarray(np.clip(base, 0, 255).astype("uint8")).convert("RGBA")


def arc(draw, c, r, a0, a1, w, fill):
    steps = max(8, int(abs(a1 - a0) * 2))
    for i in range(steps + 1):
        a = math.radians(a0 + (a1 - a0) * i / steps)
        x, y = c + math.sin(a) * r, c - math.cos(a) * r
        draw.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=fill)


def artwork(n, scale):
    big = n * S
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = big / 2
    u = big * scale / 512  # unit: 1 on a 512 canvas at full size
    arc(d, c, 168 * u, -135, 135, 22 * u, (255, 255, 255, 46))
    arc(d, c, 168 * u, -135, 70, 22 * u, (232, 131, 46, 255))
    for k in range(40, 0, -1):  # disc, lit from the upper left
        f = k / 40
        rr = 122 * u * f
        col = tuple(int(a * f + b * (1 - f)) for a, b in ((16, 70), (32, 98), (27, 88)))
        d.ellipse((c - rr - 8 * u * (1 - f), c - rr - 12 * u * (1 - f), c + rr - 8 * u * (1 - f), c + rr - 12 * u * (1 - f)), fill=col + (255,))
    d.ellipse((c - 122 * u, c - 122 * u, c + 122 * u, c + 122 * u), outline=(255, 255, 255, 70), width=max(1, int(3 * u)))
    a = math.radians(70)
    x0, y0 = c + math.sin(a) * 36 * u, c - math.cos(a) * 36 * u
    x1, y1 = c + math.sin(a) * 100 * u, c - math.cos(a) * 100 * u
    d.line((x0, y0, x1, y1), fill=(255, 255, 255, 255), width=int(22 * u))
    for x, y in ((x0, y0), (x1, y1)):
        d.ellipse((x - 11 * u, y - 11 * u, x + 11 * u, y + 11 * u), fill=(255, 255, 255, 255))
    return layer.resize((n, n), Image.LANCZOS)


def icon(n, scale=1.0, rounded=True):
    img = background(n)
    img.alpha_composite(artwork(n, scale))
    if rounded:
        m = Image.new("L", (n * S, n * S), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, n * S - 1, n * S - 1), radius=int(n * S * .22), fill=255)
        img.putalpha(m.resize((n, n), Image.LANCZOS))
    return img


def main():
    out = os.path.join(ROOT, "images", "icons")
    os.makedirs(out, exist_ok=True)
    icon(512).save(os.path.join(out, "icon-512.png"), optimize=True)
    icon(192).save(os.path.join(out, "icon-192.png"), optimize=True)
    icon(512, .74, rounded=False).convert("RGB").save(os.path.join(out, "maskable-512.png"), optimize=True)
    icon(180, 1.0, rounded=False).convert("RGB").save(os.path.join(ROOT, "images", "apple-touch-icon.png"), optimize=True)
    print("icons written")


if __name__ == "__main__":
    main()
