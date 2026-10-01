#!/usr/bin/env python3
"""Consistency checks for the search and answer-engine layer. Exits non-zero on any failure.

Optional: pass --schema PATH to schema-dts' schema.d.ts to check JSON-LD property names against schema.org.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad = []


def fail(msg):
    bad.append(msg)
    print("FAIL", msg)


def rd(n):
    with open(os.path.join(ROOT, n), encoding="utf-8") as f:
        return f.read()


page = rd("index.html")
base = re.search(r'<link rel="canonical" href="([^"]+)">', page).group(1)

# JSON-LD
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)
if len(blocks) != 1:
    fail(f"expected one JSON-LD block, found {len(blocks)}")
data = json.loads(blocks[0])
graph = data["@graph"]
ids = {n["@id"] for n in graph if "@id" in n}


def refs(o):
    if isinstance(o, dict):
        if set(o) == {"@id"}:
            yield o["@id"]
        for v in o.values():
            yield from refs(v)
    elif isinstance(o, list):
        for v in o:
            yield from refs(v)


for r in set(refs(graph)):
    if r not in ids:
        fail(f"unresolved @id {r}")

# FAQ: visible answers equal the structured ones
faq_ld = next((n for n in graph if n["@type"] == "FAQPage"), None)


class Faq(HTMLParser):
    def __init__(s):
        super().__init__()
        s.on = 0
        s.q = []
        s.a = []
        s.cur = None

    def handle_starttag(s, t, a):
        c = dict(a).get("class", "")
        if t == "section" and dict(a).get("id") == "faq":
            s.on = 1
        if s.on and t == "h3":
            s.cur = "q"
            s.q.append("")
        if s.on and t == "p" and len(s.a) < len(s.q):
            s.cur = "a"
            s.a.append("")

    def handle_endtag(s, t):
        if t in ("h3", "p"):
            s.cur = None
        if t == "section":
            s.on = 0 if s.on else s.on

    def handle_data(s, d):
        if s.cur == "q":
            s.q[-1] += d
        elif s.cur == "a":
            s.a[-1] += d


if faq_ld is None:
    # no FAQPage markup, so no FAQ may be visible either (markup must match visible content, and the reverse)
    if 'id="faq"' in page:
        fail("a visible FAQ section exists but there is no FAQPage markup")
else:
    f = Faq()
    f.feed(page)
    norm = lambda x: re.sub(r"\s+", " ", html.unescape(x)).strip()
    vis = [(norm(q), norm(a)) for q, a in zip(f.q, f.a)]
    ld = [(norm(e["name"]), norm(e["acceptedAnswer"]["text"])) for e in faq_ld["mainEntity"]]
    if vis != ld:
        fail(f"visible FAQ ({len(vis)}) differs from FAQPage JSON-LD ({len(ld)})")

# head
title = re.search(r"<title>(.*?)</title>", page, re.S).group(1)
desc = re.search(r'<meta name="description" content="(.*?)"', page).group(1)
if not 30 <= len(title) <= 65:
    fail(f"title length {len(title)}")
if not 70 <= len(desc) <= 175:
    fail(f"description length {len(desc)}")
for label, pat in [("og:title", r'property="og:title"'), ("og:image", r'property="og:image"'), ("twitter:card", r'name="twitter:card"')]:
    if not re.search(pat, page):
        fail(f"missing {label}")

# anchors
for a in set(re.findall(r'href="#([^"]+)"', page)):
    if not re.search(rf'id="{re.escape(a)}"', page):
        fail(f"anchor #{a} has no target")

# generated files
robots, sitemap = rd("robots.txt"), rd("sitemap.xml")
if f"Sitemap: {base}sitemap.xml" not in robots:
    fail("robots.txt does not name the sitemap")
if f"<loc>{base}</loc>" not in sitemap:
    fail("sitemap.xml lacks the canonical URL")
for n in ("llms.txt", "llms-full.txt", "robots.txt", "sitemap.xml"):
    t = rd(n)
    if "—" in t:
        fail(f"em dash in {n}")
    if base not in t and n.startswith("llms"):
        fail(f"{n} does not use the canonical base")

# heading outline
hs = [int(x) for x in re.findall(r"<h([1-6])[ >]", page)]
if hs.count(1) != 1:
    fail(f"{hs.count(1)} h1 elements")
for p, c in zip(hs, hs[1:]):
    if c > p + 1:
        fail(f"heading jump h{p} to h{c}")

# schema.org vocabulary
if "--schema" in sys.argv:
    dts = open(sys.argv[sys.argv.index("--schema") + 1], encoding="utf-8").read()
    ext = {m[0]: [x.strip() for x in m[1].split(",")] for m in re.findall(r"interface (\w+?)Base extends ([\w, <>]+?) \{", dts)}
    own = {}
    for m in re.finditer(r"interface (\w+?)Base (?:extends [\w, <>]+ )?\{(.*?)\n\}", dts, re.S):
        own[m.group(1)] = set(re.findall(r'^\s+"?([A-Za-z]\w*)"?\??:', m.group(2), re.M))

    def props(t, seen=None):
        seen = seen or set()
        if t in seen:
            return set()
        seen.add(t)
        out = set(own.get(t, ()))
        for p in ext.get(t, ()):
            out |= props(p.replace("Base", "").replace("Partial<IdReference>", ""), seen) if p.strip() else set()
        return out

    def walk(o, t=None):
        if isinstance(o, dict):
            t = o.get("@type", t)
            tt = t[0] if isinstance(t, list) else t
            if tt and tt in own or tt in ext:
                allowed = props(tt) | {"@type", "@id", "@context"}
                for k in o:
                    if k not in allowed:
                        fail(f"{tt}.{k} is not in schema.org")
            for k, v in o.items():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v, t)

    walk(graph)
    print(f"schema types checked: {sorted({n['@type'] if isinstance(n['@type'], str) else n['@type'][0] for n in graph})}")

print("OK" if not bad else f"{len(bad)} problem(s)")
sys.exit(1 if bad else 0)
