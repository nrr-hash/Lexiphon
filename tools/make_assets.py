#!/usr/bin/env python3
"""Generates the images and audio that Lexiphon's studio links to.

Everything here is synthesised from code: no recordings, no stock images, nothing sampled.
Run from the repository root:  python3 tools/make_assets.py
Needs numpy and Pillow; ffmpeg is not required.

Writes:
  images/walnut.jpg            tileable walnut grain for the cabinet cheeks
  images/panel.png             tileable matte panel grain
  images/emblems/<name>.svg    one emblem per archetype, in that archetype's mark colour
  audio/beds/<name>.wav        six-second loopable bed per archetype (16 kHz, mono)
  audio/fx/rocker.wav, tick.wav  short switch sounds
"""
import math
import os
import wave

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(1971)

# mark colours, as in CUES in index.html
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
def periodic_noise(h, w, cells_y, cells_x, octaves=4):
    """Tileable value noise: sums of bilinear-interpolated random grids that wrap."""
    total = np.zeros((h, w))
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        cy, cx = cells_y * 2 ** o, cells_x * 2 ** o
        grid = rng.random((cy, cx))
        ys = np.linspace(0, cy, h, endpoint=False)
        xs = np.linspace(0, cx, w, endpoint=False)
        y0 = np.floor(ys).astype(int) % cy
        x0 = np.floor(xs).astype(int) % cx
        y1, x1 = (y0 + 1) % cy, (x0 + 1) % cx
        fy = (ys - np.floor(ys))[:, None]
        fx = (xs - np.floor(xs))[None, :]
        fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
        a = grid[y0][:, x0] * (1 - fx) + grid[y0][:, x1] * fx
        b = grid[y1][:, x0] * (1 - fx) + grid[y1][:, x1] * fx
        total += amp * (a * (1 - fy) + b * fy)
        norm += amp
        amp *= 0.5
    return total / norm


def walnut(path, h=1024, w=512):
    warp = periodic_noise(h, w, 3, 2, 4)
    fine = periodic_noise(h, w, 64, 96, 2)
    x = np.arange(w)[None, :] / w
    y = np.arange(h)[:, None] / h
    rings = np.sin(2 * math.pi * (x * 14 + warp * 5.5 + 0.35 * np.sin(2 * math.pi * y * 2)))
    rings = 0.5 + 0.5 * rings
    rings = rings ** 1.6
    pores = (fine > 0.66).astype(float) * 0.5
    t = np.clip(0.55 * rings + 0.25 * warp + 0.2 * fine - pores * 0.25, 0, 1)
    stops = np.array([[38, 22, 14], [66, 38, 22], [104, 64, 38], [140, 92, 58]], float)
    pos = np.linspace(0, 1, len(stops))
    img = np.stack([np.interp(t, pos, stops[:, c]) for c in range(3)], axis=-1)
    Image.fromarray(img.clip(0, 255).astype("uint8")).save(path, quality=84, optimize=True)


def panel(path, n=256):
    g = periodic_noise(n, n, 32, 32, 3)
    fine = rng.random((n, n))
    base = 22 + 10 * g + 6 * fine
    img = np.stack([base, base, base * 1.02], axis=-1)
    Image.fromarray(img.clip(0, 255).astype("uint8")).save(path, optimize=True)


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


# ---------------------------------------------------------------- audio
SR = 16000
LOOP = 6.0
N = int(SR * LOOP)
BEAT = 0.5  # 120 bpm: a loop is twelve beats, three bars of four
T = np.arange(N) / SR


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a, d, s, r, hold=None):
    """ADSR over n samples; 'hold' is the gate length in samples."""
    hold = n if hold is None else hold
    e = np.zeros(n)
    ai, di, ri = max(1, int(a * SR)), max(1, int(d * SR)), max(1, int(r * SR))
    for i in range(min(n, hold)):
        if i < ai:
            e[i] = i / ai
        elif i < ai + di:
            e[i] = 1 - (1 - s) * (i - ai) / di
        else:
            e[i] = s
    if hold < n:
        lvl = e[hold - 1] if hold > 0 else 0
        k = min(ri, n - hold)
        e[hold:hold + k] = lvl * (1 - np.arange(k) / ri)
    return e


def osc(f, n, wave_="saw", phase=0.0):
    ph = (phase + np.cumsum(np.full(n, f) / SR)) % 1.0
    if wave_ == "saw":
        return 2 * ph - 1
    if wave_ == "square":
        return np.where(ph < 0.5, 1.0, -1.0)
    if wave_ == "tri":
        return 4 * np.abs(ph - 0.5) - 1
    return np.sin(2 * math.pi * ph)


def place(buf, sig, t0):
    """Add a sound at time t0, wrapping round the end so the loop stays seamless."""
    i = int(t0 * SR) % N
    idx = (np.arange(len(sig)) + i) % N
    np.add.at(buf, idx, sig)


def note(buf, t0, m, dur, wave_="saw", a=0.01, d=0.2, s=0.5, r=0.3, amp=0.3, det=0.0, harm=None):
    n = int((dur + r) * SR)
    sig = osc(hz(m) * 2 ** (det / 1200), n, wave_)
    if harm:
        for k, g in harm:
            sig = sig + g * osc(hz(m) * k, n, "sin")
    place(buf, sig * env(n, a, d, s, r, int(dur * SR)) * amp, t0)


def fft_filter(x, kind, f, slope=2):
    """Circular filtering in the frequency domain: loops stay seamless."""
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    if kind == "lp":
        H = 1 / (1 + (fr / f) ** (2 * slope))
    elif kind == "hp":
        H = 1 - 1 / (1 + (fr / f) ** (2 * slope))
    else:
        H = np.ones_like(fr)
    return np.fft.irfft(X * H, len(x))


def reverb(x, secs=1.6, mix=0.3, damp=2500):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (secs * SR / 5.5))
    ir = fft_filter(np.pad(ir, (0, N - n)) if n < N else ir[:N], "lp", damp)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    wet = np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(ir), N)
    return x * (1 - mix) + wet * mix * 1.4


def noise(lp=None, hp=None):
    x = rng.standard_normal(N)
    if lp:
        x = fft_filter(x, "lp", lp)
    if hp:
        x = fft_filter(x, "hp", hp)
    return x / (np.abs(x).max() + 1e-9)


def pulse_train(beats, amp=1.0, decay=0.08):
    buf = np.zeros(N)
    for b in beats:
        n = int(0.5 * SR)
        e = np.exp(-np.arange(n) / (decay * SR))
        place(buf, e * amp, b * BEAT)
    return buf


def kick(buf, t0, amp=0.6):
    n = int(0.3 * SR)
    f = 48 + 90 * np.exp(-np.arange(n) / (0.025 * SR))
    sig = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-np.arange(n) / (0.11 * SR))
    place(buf, sig * amp, t0)


def hat(buf, t0, amp=0.2):
    n = int(0.06 * SR)
    sig = noise(hp=4000)[:n] * np.exp(-np.arange(n) / (0.012 * SR))
    place(buf, sig * amp, t0)


def pluck(buf, t0, m, amp=0.4, decay=0.9):
    """Karplus-Strong string."""
    f = hz(m)
    p = int(SR / f)
    n = int(decay * 2.2 * SR)
    line = list(rng.uniform(-1, 1, p))
    out_ = np.zeros(n)
    for i in range(n):
        out_[i] = line[i % p]
        line[i % p] = 0.4985 * (line[i % p] + line[(i + 1) % p])
    place(buf, out_ * amp, t0)


def bell(buf, t0, m, amp=0.25, decay=1.6):
    n = int(decay * 2 * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for ratio, g in ((1, 1), (2.76, 0.5), (5.4, 0.3), (8.93, 0.15)):
        sig += g * np.sin(2 * math.pi * hz(m) * ratio * t) * np.exp(-t / (decay / (0.6 + ratio * 0.25)))
    place(buf, sig * amp, t0)


def pad(buf, m_list, wave_="saw", amp=0.12, lp=900, det=6):
    n = N
    sig = np.zeros(n)
    for m in m_list:
        for dcents in (-det, det):
            f = round(hz(m) * 2 ** (dcents / 1200) * LOOP) / LOOP  # whole cycles per loop: seamless
            sig += osc(f, n, wave_)
    sig = fft_filter(sig, "lp", lp)
    sig /= np.abs(sig).max() + 1e-9
    buf += sig * amp


def drone(buf, m, amp=0.2, wave_="sin"):
    f = round(hz(m) * LOOP) / LOOP
    buf += osc(f, N, wave_) * amp


def swell(buf, rate_per_loop=1, depth=0.5):
    return 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * math.pi * rate_per_loop * T / LOOP))


# notes: A minor pentatonic over an A/E drone, so any blend stays consonant
A2, E3, A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5 = 45, 52, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81


def bed_innocent():
    b = np.zeros(N)
    drone(b, A3, 0.06)
    seq = [(0, E5), (1, G5), (2, A5), (3, G5), (4, E5), (5, D5), (6, C5), (8, D5), (9, E5), (10, G5)]
    for beat, m in seq:
        bell(b, beat * BEAT * 1.0, m, 0.22)
    return reverb(b, 1.8, 0.35, 5000)


def bed_explorer():
    b = np.zeros(N)
    w = noise(lp=1400, hp=200) * swell(b, 1, 0.6)
    b += w * 0.22
    for beat in range(0, 12, 2):
        kick(b, beat * BEAT, 0.42)
    for beat in (3, 7, 11):
        kick(b, beat * BEAT, 0.3)
    drone(b, A2, 0.12, "tri")
    for beat, m in ((0, A3), (5, E4), (8, D4)):
        note(b, beat * BEAT, m, 0.6, "tri", 0.02, 0.3, 0.3, 0.6, 0.12)
    return reverb(b, 1.4, 0.25, 3000)


def bed_sage():
    b = np.zeros(N)
    drone(b, A2, 0.18)
    drone(b, E3, 0.1)
    for beat, m in ((0, A4), (4, E4), (7, C5), (10, D4)):
        note(b, beat * BEAT, m, 0.35, "sin", 0.005, 0.25, 0.0, 0.8, 0.2)
    return reverb(b, 2.2, 0.3, 4000)


def bed_hero():
    b = np.zeros(N)
    for beat in range(12):
        kick(b, beat * BEAT, 0.55 if beat % 4 == 0 else 0.35)
        hat(b, (beat + 0.5) * BEAT, 0.14)
    for beat, m in ((0, A3), (3, A3), (6, E4), (8, A3), (10, G4)):
        note(b, beat * BEAT, m, 0.42, "saw", 0.01, 0.18, 0.5, 0.15, 0.18, det=8)
    return reverb(b, 1.0, 0.15, 3000)


def bed_outlaw():
    b = np.zeros(N)
    base = np.zeros(N)
    for beat, m in ((0, A2), (1.5, A2), (3, C4 - 24), (6, A2), (8, E3 - 12), (9.5, A2)):
        note(base, beat * BEAT, m, 0.4, "square", 0.002, 0.1, 0.6, 0.1, 0.4)
    base = np.tanh(base * 4) * 0.35
    b += base
    for beat in (2, 6, 10):
        n = int(0.25 * SR)
        place(b, noise(hp=800)[:n] * np.exp(-np.arange(n) / (0.05 * SR)) * 0.3, beat * BEAT)
    for beat in (0, 4, 8):
        kick(b, beat * BEAT, 0.5)
    return fft_filter(b, "lp", 5000)


def bed_magician():
    b = np.zeros(N)
    pad(b, [A3, E4, A4], "sin", 0.2, 2600, 9)
    sh = noise(hp=3000, lp=7000) * swell(b, 2, 0.8)
    b += sh * 0.05
    for beat, m in ((1, E5), (4, A5), (7, G5), (10, C5)):
        bell(b, beat * BEAT, m, 0.14, 2.4)
    return reverb(b, 3.0, 0.5, 4500)


def bed_regular():
    b = np.zeros(N)
    for beat, m in ((0, A3), (1, E4), (2, A4), (3, E4), (4, D4), (5, A3), (6, D4), (7, A4), (8, C4), (9, E4), (10, G4), (11, E4)):
        pluck(b, beat * BEAT, m - 12 if m > 65 else m, 0.35)
    kick(b, 0, 0.25)
    kick(b, 4 * BEAT, 0.22)
    kick(b, 8 * BEAT, 0.22)
    return reverb(b, 0.9, 0.18, 3500)


def bed_lover():
    b = np.zeros(N)
    pad(b, [A2, E3], "saw", 0.16, 500, 5)
    vib = 1 + 0.004 * np.sin(2 * math.pi * 5 * T)
    for beat, m, dur in ((0, A3, 2.4), (4, C4, 1.6), (8, E4, 2.2)):
        n = int((dur + 0.8) * SR)
        f = hz(m)
        ph = np.cumsum(f * vib[:n] / SR) % 1.0
        sig = fft_filter(np.pad(2 * ph - 1, (0, N - n)), "lp", 900)[:n]
        place(b, sig * env(n, 0.4, 0.4, 0.7, 0.8, int(dur * SR)) * 0.24, beat * BEAT)
    b += noise(lp=600, hp=120) * 0.04
    return reverb(b, 2.4, 0.4, 3000)


def bed_jester():
    b = np.zeros(N)
    for beat, m in ((0, A4), (0.75, C5), (1.5, E5), (3, D5), (3.75, C5), (4.5, A4), (6, G4), (6.75, A4), (7.5, C5),
                    (9, E5), (9.75, D5), (10.5, C5)):
        note(b, beat * BEAT, m, 0.12, "square", 0.003, 0.08, 0.2, 0.06, 0.16)
    for beat in range(0, 12, 2):
        hat(b, (beat + 1) * BEAT, 0.25)
    for beat in (0, 3, 6, 9):
        kick(b, beat * BEAT, 0.28)
    return reverb(b, 0.6, 0.12, 4000)


def bed_caregiver():
    b = np.zeros(N)
    pad(b, [A3, E4], "sin", 0.22, 1400, 4)
    for beat, m in ((0, E4), (2, A4), (4, C5), (6, A4), (8, G4), (10, E4)):
        note(b, beat * BEAT, m, 0.5, "sin", 0.01, 0.6, 0.1, 1.2, 0.16, harm=[(2, 0.3), (3, 0.12)])
    return reverb(b, 2.0, 0.35, 3500)


def bed_creator():
    b = np.zeros(N)
    drone(b, A2, 0.1, "tri")
    arp = [A3, C4, E4, A4, E4, C4]
    for i in range(24):
        note(b, i * BEAT / 2, arp[i % 6] + (12 if i % 8 >= 5 else 0), 0.2, "saw", 0.004, 0.12, 0.25, 0.12, 0.11, det=10)
    for beat, m in ((1, E4 - 12), (5, D4 - 12), (9, C4 - 12)):
        pluck(b, beat * BEAT, m, 0.22)
    b = fft_filter(b, "lp", 3600)
    return reverb(b, 1.3, 0.3, 3500)


def bed_ruler():
    b = np.zeros(N)
    drone(b, A2, 0.2, "saw")
    b = fft_filter(b, "lp", 400)
    for beat, m in ((0, A3), (0, E4), (4, A3), (4, D4), (8, 55), (8, D4)):
        note(b, beat * BEAT, m, 1.7, "saw", 0.15, 0.4, 0.7, 0.6, 0.11, det=6)
    b = fft_filter(b, "lp", 1100)
    for beat in (0, 4, 8):
        kick(b, beat * BEAT, 0.5)
        n = int(0.5 * SR)
        place(b, (noise(lp=300)[:n]) * np.exp(-np.arange(n) / (0.2 * SR)) * 0.35, beat * BEAT)
    return reverb(b, 2.0, 0.3, 2500)


BEDS = {
    "innocent": bed_innocent, "explorer": bed_explorer, "sage": bed_sage, "hero": bed_hero,
    "outlaw": bed_outlaw, "magician": bed_magician, "regular": bed_regular, "lover": bed_lover,
    "jester": bed_jester, "caregiver": bed_caregiver, "creator": bed_creator, "ruler": bed_ruler,
}


def write_wav(path, x, sr=SR):
    x = np.asarray(x, float)
    x = x - x.mean()
    x = x / (np.sqrt((x ** 2).mean()) + 1e-9) * 0.14  # equal loudness across beds
    x = np.tanh(x * 1.6) / 1.6 if np.abs(x).max() > 0.6 else x  # soft limit, headroom for the mixer
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def fx():
    sr = 22050
    n = int(0.05 * sr)
    t = np.arange(n) / sr
    click = rng.standard_normal(n) * np.exp(-t / 0.004) + 0.8 * np.sin(2 * math.pi * 180 * t) * np.exp(-t / 0.012)
    write_wav(out("audio", "fx", "rocker.wav"), click, sr)
    n = int(0.03 * sr)
    t = np.arange(n) / sr
    tick = np.sin(2 * math.pi * 2400 * t) * np.exp(-t / 0.004) + 0.3 * rng.standard_normal(n) * np.exp(-t / 0.002)
    write_wav(out("audio", "fx", "tick.wav"), tick, sr)


def main():
    walnut(out("images", "walnut.jpg"))
    panel(out("images", "panel.png"))
    for name, col in MARK.items():
        with open(out("images", "emblems", f"{name}.svg"), "w", encoding="utf-8") as f:
            f.write(emblem(name, col))
    for name, fn in BEDS.items():
        write_wav(out("audio", "beds", f"{name}.wav"), fn())
    fx()
    print("done")


if __name__ == "__main__":
    main()
