#!/usr/bin/env python3
"""Builds the search and AI-answer layer of the site from the page itself.

One source feeds every output, so the visible FAQ, the structured data, llms.txt, llms-full.txt and the sitemap cannot disagree:

  index.html   the visible FAQ section, the JSON-LD graph, and the meta description and social tags
  llms.txt     a short map for language models (llmstxt.org convention)
  llms-full.txt  the page's own text in Markdown, without the interface and without the deliberate exhibits
  sitemap.xml  the page, its images, and the modified date (from the last git commit)
  robots.txt   an explicit welcome for search and AI-answer crawlers

  python3 tools/build_seo.py          write everything
  python3 tools/build_seo.py --check  write nothing, and report whether the files are current

Every FAQ answer cites the phrases on the page that support it. The build stops if a cited phrase is missing, so an answer
cannot outlive the sentence it came from. Run tools/check_seo.py afterwards.
"""
import argparse, datetime, html, json, os, re, subprocess, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

NAME = "Nathaniel Robertson"
TITLE = "Nathaniel Robertson, content specialist"
DESCRIPTION = ("Content specialist for source-checked B2B, B2C, and B2G writing, AI editing and governance, and content audits. "
               "Every claim goes back to its source.")

# Question, answer, and the phrases on the page that support the answer. The answers are written in the third person so that
# each one names its subject when it is lifted out of the page. Nothing in an answer goes beyond its cited phrases.
# The visible FAQ section is off. The answers below still feed the descriptions, and their cited phrases are still checked.
# FAQPage markup must match visible content, so it is off with the section.
SHOW_FAQ = False

FAQ = [
    ("What does Nathaniel Robertson do?",
     "Nathaniel Robertson is a content specialist. He devises, produces, and scales digital content with frontier and open-weight models that he configures and checks himself, and every claim goes back to its source before it goes out. His work covers source-checked B2B, B2C, and B2G writing, AI editing and governance, and content audits.",
     ["I devise, produce, and scale digital content with frontier and open-weight models that I configure and check myself",
      "Every claim goes back to its source before it goes out", "Source-checked B2B, B2C, and B2G writing", "Ask for a content audit"]),
    ("What is he working on now?",
     "Nathaniel Robertson is a freelance consultant at Switch Ltd (January 2026 to present), a content producer at micro1 (July 2026 to present), and a consultant at Three Lions English GbR (2015 to present). At Switch Ltd he works on four retained accounts: BAMUK Group in the UK, Kalon Software in the US, Alter Domus in Malta, and a manufacturing group.",
     ["Freelance consultant, Switch Ltd", "Content Producer, micro1", "Consultant, Three Lions English GbR", "Jan 2026 – present", "Jul 2026 – present", "2015 – present",
      "Operate on four retained accounts: BAMUK Group in the UK, Kalon Software in the US, Alter Domus in Malta, and a manufacturing group"]),
    ("Whom has he worked with?",
     "Nathaniel Robertson has worked with BRITA, Vodafone, Alter Domus, BAMUK Group, Kalon Software, Contracts Engineering, Assemblin Caverion Group, Furnitubes, Krüger, Metsä, Nickel, NRW Invest, OBI, Trend Micro, Pipex UK, Birkelbach Media Group, and Africa GreenTec.",
     ["BRITA, Vodafone, Alter Domus, BAMUK Group, Kalon Software, Contracts Engineering, Assemblin Caverion Group, Furnitubes, Krüger, Metsä, Nickel, NRW Invest, OBI, Trend Micro, Pipex UK, Birkelbach Media Group, and Africa GreenTec"]),
    ("Which industries does he know?",
     "Nathaniel Robertson has worked in fintech, SaaS, manufacturing, telecoms, hosting and cloud, water filtration, food and beverage, legal, specialist construction, building technology, technical building solutions, facility management, and AI training data.",
     ["Fintech, SaaS, manufacturing, telecoms, hosting and cloud, water filtration, food and beverage, legal, specialist construction, building technology, technical building solutions, facility management, and AI training data"]),
    ("What material does he work from?",
     "Nathaniel Robertson takes the dense material that regulated industries run on (specifications, standards, contract small print) and turns it into English a buyer can trust.",
     ["I take the dense material that regulated industries run on (specifications, standards, contract small print) and turn it into English a buyer can trust"]),
    ("How does he keep AI-drafted content accurate?",
     "When a fact is missing, Nathaniel Robertson flags it rather than inventing it, and when a model has drafted a page, he checks it line by line. One fact base is verified once against source and then reused in every content type, and nothing ships until it has passed his own instruments and his own eye.",
     ["When a fact is missing, I flag it rather than invent it, and when a model has drafted a page, I check it line by line",
      "One fact base, verified once against source, then reused in every content type", "nothing ships until it has passed my own instruments and my own eye"]),
    ("Does he offer content audits?",
     "Yes. Nathaniel Robertson audits existing content libraries, scores them for machine-generated tells and search exposure, and prices the rebuild in writing.",
     ["Audits of existing content libraries, scored for machine-generated tells and search exposure, with the rebuild priced in writing"]),
    ("Does he work on search visibility, including AI answer engines?",
     "Yes. Nathaniel Robertson works on search visibility in three places: Google ranking (SEO), AI answer boxes (AEO), and citation inside generative engines (GEO). Search and AI answer boxes get the same facts, never a separate page written for them, and he writes answer blocks to be lifted whole.",
     ["Search visibility in three places: Google ranking (SEO), AI answer boxes (AEO), and citation inside generative engines (GEO)",
      "Search and AI answer boxes get the same facts, never a separate page written for them", "I write answer blocks to be lifted whole"]),
    ("Are the concept pages real client work?",
     "No. The AX Hotels, Cambridge Audio, Rega, and Gordon Murray Automotive pages are speculative concept pages offered as testbeds for the method, and product names, product photography, and brand marks belong to their owners. The Published work section is live client work, checked against the client’s own source material and signed off by the client.",
     ["The AX Hotels, Cambridge Audio, Rega, and Gordon Murray Automotive pages are speculative concept pages offered as testbeds for the method",
      "Product names, product photography, and brand marks belong to their owners",
      "Each piece here is live client work, checked against the client’s own source material and signed off by them"]),
    ("What is Lexiphon?",
     "Lexiphon is a worked example, on this page, of a brand voice written down as a profile. The profile sets tone on four dials, after the Nielsen Norman Group, and the tone sets what leads, the point of view, the rhythm, and the words. It applies the profile to one fixed set of facts, and checks a visitor's own drafts against it. It runs on rules in the browser, and no language model is called.",
     ["Lexiphon writes those decisions down as a profile", "applies it to one fixed set of facts", "checks your own drafts against it", "no language model is called"]),
    ("Where is he based, and which languages does he use?",
     "Nathaniel Robertson is based in Gozo, Malta, and is remote-ready. He works in English (native), German (C1), and French (B1).",
     ["Gozo, Malta, and remote-ready", "English native, German C1, French B1"]),
]

AI_SEARCH = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User", "DuckAssistBot",
             "MistralAI-User", "Applebot", "Bingbot", "Googlebot"]
AI_TRAINING = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent"]


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text, check):
    old = read(path) if os.path.exists(path) else None
    if old == text:
        return False
    if check:
        print(f"stale: {path}")
        return True
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print(f"wrote: {path}")
    return True


def norm(s):
    s = html.unescape(s)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def esc(s):
    return html.escape(s, quote=False)


def plain_page_text(page):
    """The page's visible text, without scripts, styles, markup, and without the FAQ itself."""
    body = re.sub(r"<!-- faq:start -->.*?<!-- faq:end -->", " ", page, flags=re.S)
    body = re.sub(r"<(script|style|svg|noscript|textarea)\b.*?</\1>", " ", body, flags=re.S | re.I)
    body = re.sub(r"<(?:br|/p|/li|/dd|/dt|/h\d|/div|/figcaption)[^>]*>", " ", body)
    body = re.sub(r"<[^>]+>", "", body)
    return norm(body)


def base_url(page):
    m = re.search(r'<link rel="canonical" href="([^"]+)">', page)
    if not m:
        sys.exit("No canonical link in index.html.")
    return m.group(1)


def git_date():
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs"], capture_output=True, text=True, check=True).stdout.strip()
        return out or datetime.date.today().isoformat()
    except Exception:
        return datetime.date.today().isoformat()


def strip_tags(s):
    return norm(re.sub(r"<[^>]+>", "", s))


def gather(page):
    """Facts the page states, read from its own markup."""
    published = []
    for m in re.finditer(r'<figcaption><a href="([^"]+)"[^>]*>([^<]+)</a><p>(.*?)</p></figcaption>', page, re.S):
        published.append((norm(m.group(2)), m.group(1), strip_tags(m.group(3))))
    for m in re.finditer(r'<div class="pub"><a href="([^"]+)"[^>]*>([^<]+)</a><p>(.*?)</p></div>', page, re.S):
        published.append((norm(m.group(2)), m.group(1), strip_tags(m.group(3))))
    concepts = []
    for m in re.finditer(r'<figure class="print">(.*?)</figure>', page, re.S):
        f = m.group(1)
        brand = strip_tags(re.search(r'class="p-brand">(.*?)</span>', f, re.S).group(1))
        title = strip_tags(re.search(r'class="p-t">(.*?)</b>', f, re.S).group(1))
        cap = strip_tags(re.search(r'class="p-cap">(.*?)</span>', f, re.S).group(1))
        pdf = re.search(r'class="p-pdf" href="([^"]+)"', f).group(1)
        alt = html.unescape(re.search(r'class="p-prev"[^>]*alt="([^"]*)"', f).group(1))
        img = re.search(r'class="p-prev"[^>]*src="([^"]+)"', f).group(1)
        concepts.append((brand.replace(", concept page", ""), title, cap, pdf, alt, img))
    hired = {}
    sec = re.search(r'<section[^>]*aria-labelledby="hired-h">(.*?)</section>', page, re.S).group(1)
    for m in re.finditer(r"<div><h3>([^<]+)</h3><ul>(.*?)</ul></div>", sec, re.S):
        hired[norm(m.group(1))] = [strip_tags(x) for x in re.findall(r"<li>(.*?)</li>", m.group(2), re.S)]
    return published, concepts, hired


def faq_html():
    items = "\n".join(f'    <div class="faq-item"><h3>{esc(q)}</h3><p>{esc(a)}</p></div>' for q, a, _ in FAQ)
    return ('<!-- faq:start -->\n<section id="faq" aria-labelledby="faq-h">\n  <div class="sec-head"><h2 id="faq-h">Questions people ask</h2>'
            '<p class="one spread">Short answers, each drawn from sentences elsewhere on this page.</p></div>\n  <div class="faq">\n' + items +
            '\n  </div>\n</section>\n<!-- faq:end -->')


def prerender_headline(page):
    """Writes the headline's weighted word spans into the HTML, the same markup js/page.js ramp() builds.

    The script is deferred, so without this the headline paints once as plain text and again as weighted words, and on a phone
    the second paint wraps differently and the page jumps. Edit the headline as plain text in its data-ramp lines and run this."""
    def line(m):
        seat = m.group(2)
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(3))).strip()
        words = text.split(" ")
        n = max(1, int(seat or 1)); start = len(words) - n
        out, box = [], None
        for i, w in enumerate(words):
            t = i / (len(words) - 1) if len(words) > 1 else 1
            span = (f'<span class="w" style="--wt:{int(250 + 650 * t ** 1.35 + 0.5)};'
                    f'color:color-mix(in srgb, var(--ink) {int(55 + 45 * t + 0.5)}%, var(--slate))">{esc(w)}</span>')
            if i == start:
                out.append('<span class="seat">')
            out.append(span)
            if i < len(words) - 1:
                out.append(" ")
        out.append("</span>")
        return m.group(1) + "".join(out) + "</span>"
    pat = r'(<span class="line" data-ramp(?: data-seat="(\d+)")?>)(.*?)</span>(?=\s*(?:<span class="line"|</h1>))'
    return re.sub(pat, line, page, flags=re.S)


def jsonld(page, base, published, concepts, hired, date):
    old = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', page, re.S).group(1))
    if "@graph" in old:
        person = next(n for n in old["@graph"] if n.get("@type") == "Person")
    else:
        person = old["mainEntity"]
    person = {k: v for k, v in person.items() if k not in ("makesOffer", "url", "@id", "givenName", "familyName")}
    pid, wid, prof = base + "#person", base + "#website", base + "#profile"
    person = {"@type": "Person", "@id": pid, "url": base, "givenName": "Nathaniel", "familyName": "Robertson", **person}
    person["knowsAbout"] = list(dict.fromkeys(person.get("knowsAbout", []) + ["Brand archetypes", "Tone of voice", "Legal translation", "Voiceover", "Video annotation for AI training data"]))
    person["makesOffer"] = [
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": name, "description": " ".join(items), "provider": {"@id": pid}, "areaServed": "Worldwide, remote"}}
        for name, items in hired.items()]
    faq = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a, _ in FAQ]
    return {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": wid, "url": base, "name": TITLE, "inLanguage": "en-GB", "publisher": {"@id": pid}},
        {"@type": "ProfilePage", "@id": prof, "url": base, "name": TITLE, "description": DESCRIPTION, "inLanguage": "en-GB", "isPartOf": {"@id": wid},
         "mainEntity": {"@id": pid}, "dateModified": date,
         "primaryImageOfPage": {"@type": "ImageObject", "url": base + "images/og.png", "width": 1200, "height": 630}},
        person,
        {"@type": "WebApplication", "@id": base + "#lexiphon", "name": "Lexiphon", "url": base + "#studio", "inLanguage": "en-GB",
         "description": next(a for q, a, _ in FAQ if q == "What is Lexiphon?"), "applicationCategory": "BusinessApplication", "operatingSystem": "Any, in a web browser",
         "browserRequirements": "Requires JavaScript and the Web Audio API", "isAccessibleForFree": True, "creator": {"@id": pid},
         "softwareVersion": "1.3"},
        {"@type": "ItemList", "@id": base + "#published", "name": "Published work", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "CreativeWork", "name": n, "url": u, "description": d, "creator": {"@id": pid}, "inLanguage": "en-GB"}}
            for i, (n, u, d) in enumerate(published)]},
        {"@type": "ItemList", "@id": base + "#gallery", "name": "Portfolio: five concept pages", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "CreativeWork", "name": f"{b}, {t} (concept page)", "url": pdf, "genre": "Speculative concept page",
             "description": c + " A speculative concept page offered as a testbed for the method.", "creator": {"@id": pid}, "inLanguage": "en-GB",
             "image": base + img}}
            for i, (b, t, c, pdf, alt, img) in enumerate(concepts)]},
    ] + ([{"@type": "FAQPage", "@id": base + "#faq", "url": base + "#faq", "inLanguage": "en-GB", "mainEntity": faq}] if SHOW_FAQ else [])}


def head_tags(page, base):
    """Set the description and social tags to one agreed text, and add what was missing."""
    def setmeta(attr, key, content, after=None):
        nonlocal page
        pat = re.compile(r'<meta %s="%s" content="[^"]*">' % (attr, re.escape(key)))
        tag = f'<meta {attr}="{key}" content="{html.escape(content, quote=True)}">'
        if pat.search(page):
            page = pat.sub(lambda m: tag, page, count=1)
        elif after:
            page = page.replace(after, after + "\n" + tag, 1)
        else:
            sys.exit("cannot place " + key)
    setmeta("name", "description", DESCRIPTION)
    setmeta("property", "og:description", DESCRIPTION)
    setmeta("property", "og:title", TITLE)
    anchor = '<meta property="og:type" content="profile">'
    setmeta("property", "og:locale", "en_GB", anchor)
    setmeta("property", "og:site_name", NAME, '<meta property="og:locale" content="en_GB">')
    setmeta("property", "profile:first_name", "Nathaniel", '<meta property="og:site_name" content="%s">' % NAME)
    setmeta("property", "profile:last_name", "Robertson", '<meta property="profile:first_name" content="Nathaniel">')
    setmeta("property", "og:image:type", "image/png", '<meta property="og:image:height" content="630">')
    setmeta("name", "twitter:title", TITLE, '<meta name="twitter:card" content="summary_large_image">')
    setmeta("name", "twitter:description", DESCRIPTION, '<meta name="twitter:title" content="%s">' % html.escape(TITLE, quote=True))
    setmeta("name", "twitter:image:alt", "Nathaniel Robertson, content specialist. AI drafts the content. I answer for every claim.", '<meta name="twitter:image" content="%simages/og.png">' % base)
    setmeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1", '<meta name="author" content="%s">' % NAME)
    extra = [
        f'<link rel="alternate" hreflang="en-GB" href="{base}">',
        f'<link rel="alternate" hreflang="x-default" href="{base}">',
        '<link rel="alternate" type="text/plain" href="llms.txt" title="A short map of this site for language models">',
        '<link rel="sitemap" type="application/xml" href="sitemap.xml">',
    ]
    for tag in extra:
        if tag not in page:
            page = page.replace(f'<link rel="canonical" href="{base}">', f'<link rel="canonical" href="{base}">\n{tag}', 1) if 'hreflang="en-GB"' not in tag else \
                page.replace(f'<link rel="canonical" href="{base}">', f'<link rel="canonical" href="{base}">\n{tag}', 1)
    return page


# ---- llms.txt and llms-full.txt -------------------------------------------------------------------------------------------
CARD_HEADS = {"## How it sounds", "## Whether it is true", "## Who it is for"}


class Walker(HTMLParser):
    """Collects the page's own prose as Markdown lines, skipping the interface and the deliberate exhibits."""
    SKIP_TAGS = {"script", "style", "svg", "noscript", "textarea", "button", "nav", "dialog", "canvas", "select", "input", "summary", "details", "footer"}
    SKIP_IDS = {"method", "gallery", "published", "faq", "contact", "studio"}
    SKIP_CLASSES = {"sy-lex", "synth", "instrument", "slop", "prints", "close", "audit", "colophon", "jump", "weight-note", "pins", "shots", "pubs", "dz", "ledger"}

    def __init__(self):
        super().__init__()
        self.stack, self.lines, self.buf, self.kind, self.skip = [], [], "", None, 0
        self.in_main = False
        self.dt = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = set((a.get("class") or "").split())
        if tag == "main":
            self.in_main = True
        skip = tag in self.SKIP_TAGS or a.get("id") in self.SKIP_IDS or bool(cls & self.SKIP_CLASSES) or "hidden" in a
        self.stack.append((tag, skip))
        if skip:
            self.skip += 1
        if self.skip or not self.in_main:
            return
        if tag in ("h1", "h2", "h3", "h4", "p", "li", "dt", "dd"):
            self.flush()
            self.kind = tag
        elif tag == "br":
            self.buf += " "
        elif tag == "span" and self.kind == "dd" and self.buf.strip():
            self.buf += ", "

    def handle_endtag(self, tag):
        if self.stack:
            t, skip = self.stack.pop()
            if skip:
                self.skip -= 1
        if tag in ("h1", "h2", "h3", "h4", "p", "li", "dt", "dd") and not self.skip:
            self.flush()

    def handle_data(self, d):
        if self.kind and not self.skip:
            self.buf += d

    def flush(self):
        t = re.sub(r"\s+", " ", html.unescape(self.buf)).strip()
        k = self.kind
        self.buf, self.kind = "", None
        if not t or not k:
            return
        if k == "h1":
            self.lines.append("# " + t)
        elif k == "h2":
            self.lines.append("\n## " + t)
        elif k == "h3":
            self.lines.append("\n### " + t)
        elif k == "h4":
            self.lines.append("\n#### " + t)
        elif k == "li":
            self.lines.append("- " + t)
        elif k == "dt":
            self.dt = t
        elif k == "dd":
            self.lines.append(f"- {self.dt}: {t}" if self.dt else "- " + t)
        else:
            self.lines.append(t)


def llms_texts(page, base, published, concepts, date):
    w = Walker()
    w.feed(page)
    w.lines = [("\n### " + l[4:]) if l.strip() in CARD_HEADS else l for l in w.lines]
    prose = [l for l in w.lines if not l.startswith("# ") and "AI drafts the content. I answer for every claim." not in l]
    prose = [l for l in prose if "In these two lines, type weight follows" not in l and "If you have a few minutes" not in l]
    version = re.search(r"(?:Version|Release) ([0-9.]+), ([0-9]+ [A-Za-z]+ [0-9]{4})", page)
    ver = f"version {version.group(1)}, {version.group(2)}" if version else f"modified {date}"
    short = f"""# {NAME}, content specialist

> {DESCRIPTION} Based in Gozo, Malta, and remote-ready. Writes in English; also works in German (C1) and French (B1).

How to read this site:
- The page is written in the first person by {NAME}. Facts about him are on the page itself; the answers in llms-full.txt repeat only what the page states.
- "Published work" is live client work. The five "concept pages" (AX Hotels, Cambridge Audio, Rega, Gordon Murray Automotive) are speculative testbeds for his method and were not commissioned by those brands. Their names, photography, and marks belong to their owners.
- Some text on the page is an exhibit and is not his writing: an AI-written bio, a quotation from Cambridge Audio's own product page, and sample passages in the Telltale and Lexiphon tools. Please do not quote them as his copy.
- Current to {ver}.

## Pages
- [Home, with contact details]({base}): who he is, what he does, and how to reach him
- [What I can do for you]({base}#hired): AI editing and governance, writing and editing, tools and training data
- [How a piece reaches you]({base}#protocol): five steps from source material to a signed-off piece with its production notes
- [Lexiphon]({base}#studio): a brand voice written down as a profile, applied to fixed facts and used to check drafts
- [Published work]({base}#published): live client work, each piece checked against the client's own source material
- [Portfolio: five concept pages]({base}#gallery): speculative concept pages with production notes and evidence pins
- [How I work]({base}#method): five live demonstrations of how he checks tone, truth, and audience
- [Experience]({base}#work): current roles and history
- [Clients and sectors]({base}#facts): whom he has worked with, and in which industries

## Optional
- [Full text of the page, without the interface]({base}llms-full.txt)
- [Sitemap]({base}sitemap.xml)
"""
    full = [f"# {NAME}, content specialist", "", f"> {DESCRIPTION}", "",
            f"Source: {base} ({ver}). Generated from the page by tools/build_seo.py on {date}. The page is written in the first person by {NAME}.", "",
            "Not included: the interface, the demonstration texts, and three exhibits that are not his writing (an AI-written bio, a quotation from Cambridge Audio's own product page, and the sample passages in Telltale and Lexiphon).", "",
            "## The position", "AI drafts the content. I answer for every claim."]
    full += prose
    full += ["", "## How I work", "Every piece of work was put through three tests: how it sounds, whether it is true, and who it is for. Five live demonstrations on the page show the tests, and Lexiphon shows all three."]
    full += ["", "## Published work", "Each piece is live client work, checked against the client's own source material and signed off by the client."]
    full += [f"- [{n}]({u}): {d}" for n, u, d in published]
    full += ["", "## Portfolio: five concept pages",
             "Speculative concept pages, drafted with an LLM as testbeds for the method: his direction, his edit, his sign-off. Not commissioned by the brands. Each ends with production notes; three carry evidence pins that tie each claim to its note (22 claims in all)."]
    full += [f"- {b}, {t}: {c} [PDF]({pdf})" for b, t, c, pdf, _, _ in concepts]
    if SHOW_FAQ:
        full += ["", "## Questions people ask"]
        for q, a, _ in FAQ:
            full += [f"### {q}", a, ""]
    full += ["", "## Contact", "Email: nathan667@gmail.com. The last section of the page also offers a content audit."]
    return short, "\n".join(full).rstrip() + "\n"


def sitemap(base, date, concepts):
    imgs = [(base + "images/og.png", "Nathaniel Robertson, content specialist. AI drafts the content. I answer for every claim.")]
    imgs += [(base + c[5], c[4]) for c in concepts]
    rows = "\n".join(f"    <image:image>\n      <image:loc>{esc(u)}</image:loc>\n      <image:caption>{esc(c)}</image:caption>\n    </image:image>" for u, c in imgs)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>{base}</loc>
    <lastmod>{date}</lastmod>
    <xhtml:link rel="alternate" hreflang="en-GB" href="{base}"/>
{rows}
  </url>
</urlset>
"""


def robots(base):
    def block(agents):
        return "\n".join(f"User-agent: {a}\nAllow: /\n" for a in agents)
    return f"""# Everything public on this site may be indexed, quoted, and cited, including by AI search and answer engines.
# robots.txt is a request, not an enforcement.

User-agent: *
Allow: /

# Search and answer crawlers
{block(AI_SEARCH)}
# Crawlers that collect text to train models: allowed. To opt out of training only, change Allow to Disallow for these.
{block(AI_TRAINING)}
Sitemap: {base}sitemap.xml
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="Write nothing; report whether the generated files are current.")
    args = ap.parse_args()
    page = read("index.html")
    base = base_url(page)
    date = git_date()

    # 1. every cited phrase must exist on the page, outside the FAQ
    text = plain_page_text(page)
    EXTRA = [("How I work", "Every piece of work above was put through three tests: how it sounds, whether it is true, and who it is for"),
             ("How I work", "Five live demonstrations follow"), ("How I work", "All three tests")]
    missing = [(q, s) for q, _, srcs in FAQ for s in srcs if norm(s) not in text] + [(q, s) for q, s in EXTRA if norm(s) not in text]
    if missing:
        for q, s in missing:
            print(f"MISSING SOURCE for '{q}': {s}")
        sys.exit("The FAQ cites phrases that are not on the page. Fix the FAQ or the page.")
    print(f"claim check: {sum(len(s) for _, _, s in FAQ)} cited phrases, all present on the page")

    published, concepts, hired = gather(page)
    # 2. index.html: FAQ section, JSON-LD, head tags
    block = faq_html()
    if "<!-- faq:start -->" in page:
        page = re.sub(r"<!-- faq:start -->.*?<!-- faq:end -->\n*", lambda m: (block + "\n\n") if SHOW_FAQ else "", page, flags=re.S)
    elif SHOW_FAQ:
        anchor = '<section class="close" id="contact"'
        if anchor not in page:
            sys.exit("contact section not found")
        page = page.replace(anchor, block + "\n\n" + anchor, 1)
    ld = json.dumps(jsonld(page, base, published, concepts, hired, date), ensure_ascii=False, indent=1)
    page = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + ld + "</script>", page, count=1, flags=re.S)
    page = head_tags(page, base)
    page = prerender_headline(page)
    changed = write("index.html", page, args.check)
    short, full = llms_texts(page, base, published, concepts, date)
    changed |= write("llms.txt", short, args.check)
    changed |= write("llms-full.txt", full, args.check)
    changed |= write("sitemap.xml", sitemap(base, date, concepts), args.check)
    changed |= write("robots.txt", robots(base), args.check)
    if args.check and changed:
        sys.exit(1)
    if not changed:
        print("everything is current")


if __name__ == "__main__":
    main()
