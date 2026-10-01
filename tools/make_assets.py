#!/usr/bin/env python3
"""Generates Lexiphon's archetype emblems.

Everything here is drawn from code: no stock images.
Run from the repository root:  python3 tools/make_assets.py

Writes:
  images/emblems/<name>.svg    one emblem per archetype, in that archetype's mark colour
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# mark colours, as in CUES in js/engine.js
MARK = {
    "innocent": "#3f93cf", "explorer": "#c25400", "sage": "#1f3a5f", "hero": "#c62828",
    "outlaw": "#6d9a00", "magician": "#6a3fb5", "regular": "#3b5b8c", "lover": "#9b111e",
    "jester": "#e0246f", "caregiver": "#2f8f7c", "creator": "#e8702a", "ruler": "#9a7400",
}


def out(*p):
    path = os.path.join(ROOT, *p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


# ---------------------------------------------------------------- images
def star_points(cx, cy, r_out, r_in, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot + i * 180 / n)
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return " ".join(pts)


def lighten(hex_, f):
    h = hex_.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    r, g, b = (round(c + (255 - c) * f) for c in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"


def emblem(name, col):
    lt = lighten(col, 0.55)
    s = f'stroke="{col}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"'
    body = {
        "innocent": "".join(
            f'<ellipse cx="32" cy="15" rx="5.5" ry="10" fill="{col}" fill-opacity=".9" transform="rotate({a} 32 32)"/>'
            for a in range(0, 360, 45)) + f'<circle cx="32" cy="32" r="7" fill="{lt}" {s}/>',
        "explorer": f'<circle cx="32" cy="32" r="24" fill="none" {s}/>'
                    f'<polygon points="32,12 38,32 32,52 26,32" fill="{col}" fill-opacity=".85" {s}/>'
                    f'<polygon points="32,12 38,32 26,32" fill="{lt}" {s}/><circle cx="32" cy="32" r="3" fill="#fff"/>'
                    f'<path d="M32 4V9M32 55V60M4 32H9M55 32H60" fill="none" {s}/>',
        "sage": f'<path d="M32 18C24 14 14 14 7 17V49C14 46 24 46 32 50Z" fill="{lt}" fill-opacity=".55" {s}/>'
                f'<path d="M32 18C40 14 50 14 57 17V49C50 46 40 46 32 50Z" fill="{lt}" fill-opacity=".55" {s}/>'
                f'<path d="M14 26C19 25 24 26 27 28M14 34C19 33 24 34 27 36M37 28C40 26 45 25 50 26M37 36C40 34 45 33 50 34" fill="none" {s}/>',
        "hero": f'<path d="M32 7L52 14V32C52 44 43 53 32 58C21 53 12 44 12 32V14Z" fill="{col}" fill-opacity=".18" {s}/>'
                f'<polygon points="{star_points(32, 31, 13, 5.6)}" fill="{col}" {s}/>',
        "outlaw": f'<polygon points="37,5 13,36 29,36 25,59 51,26 35,26" fill="{col}" {s}/>',
        "magician": f'<path d="M40 8A25 25 0 1 0 56 44A20 20 0 1 1 40 8Z" fill="{col}" fill-opacity=".9" {s}/>'
                    f'<polygon points="{star_points(47, 20, 8, 3.4, 4, -90)}" fill="{lt}" {s}/>',
        "regular": f'<path d="M8 32L32 11L56 32" fill="none" {s}/><path d="M15 28V53H49V28" fill="{lt}" fill-opacity=".5" {s}/>'
                   f'<path d="M27 53V38H37V53" fill="{col}" fill-opacity=".85" {s}/>',
        "lover": f'<path d="M32 55C9 38 7 22 17 15C24 11 31 15 32 22C33 15 40 11 47 15C57 22 55 38 32 55Z" fill="{col}" {s}/>'
                 f'<path d="M19 22C21 19 25 19 27 22" fill="none" stroke="{lt}" stroke-width="3" stroke-linecap="round"/>',
        "jester": f'<circle cx="32" cy="32" r="25" fill="{col}" fill-opacity=".9" {s}/>'
                  f'<path d="M19 27Q23 21 27 27M37 27Q41 21 45 27" fill="none" stroke="{lt}" stroke-width="3.4" stroke-linecap="round"/>'
                  f'<path d="M17 37Q32 57 47 37Z" fill="{lt}" {s}/><path d="M23 41Q32 47 41 41" fill="none" stroke="{col}" stroke-width="2.4" stroke-linecap="round"/>'
                  f'<circle cx="11" cy="14" r="3.4" fill="{lt}" {s}/><circle cx="53" cy="14" r="3.4" fill="{lt}" {s}/>',
        "caregiver": f'<path d="M7 33A25 25 0 0 1 57 33Q51 28 45 33Q38 28 32 33Q26 28 19 33Q13 28 7 33Z" fill="{col}" fill-opacity=".85" {s}/>'
                     f'<path d="M32 33V51A6 6 0 0 1 20 51" fill="none" {s}/>',
        "creator": f'<path d="M11 53L15 40L43 12L52 21L24 49Z" fill="{lt}" fill-opacity=".6" {s}/>'
                   f'<path d="M15 40L24 49" fill="none" {s}/><path d="M38 17L47 26" fill="none" {s}/>'
                   f'<path d="M50 6V14M46 10H54M12 10V16M9 13H15" fill="none" {s}/>',
        "ruler": f'<path d="M8 47L8 20L22 34L32 13L42 34L56 20L56 47Z" fill="{col}" fill-opacity=".85" {s}/>'
                 f'<path d="M8 53H56" fill="none" {s}/><circle cx="8" cy="18" r="3.2" fill="{lt}" {s}/>'
                 f'<circle cx="32" cy="11" r="3.2" fill="{lt}" {s}/><circle cx="56" cy="18" r="3.2" fill="{lt}" {s}/>',
    }[name]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" '
            f'aria-label="{name} emblem">{body}</svg>\n')



def main():
    for name, col in MARK.items():
        with open(out("images", "emblems", f"{name}.svg"), "w", encoding="utf-8") as f:
            f.write(emblem(name, col))
    print("done")


if __name__ == "__main__":
    main()
