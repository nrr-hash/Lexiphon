#!/usr/bin/env python3
"""Moves the site to a new address: rewrites every place the public URL is written.

The URL appears in index.html (canonical, og:url, og:image, twitter:image, the structured data,
and SHARE_URL, the link Telltale copies), 404.html, robots.txt and sitemap.xml.

  python3 tools/set_site_url.py https://example.com/           # apply
  python3 tools/set_site_url.py https://example.com/ --dry-run # report only
  python3 tools/set_site_url.py --show                         # print the current address

A custom domain on GitHub Pages also needs a CNAME file holding the bare domain, and the domain set under
Settings > Pages. This script does not create either.
"""
import argparse, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["index.html", "404.html", "robots.txt", "sitemap.xml", "llms.txt", "llms-full.txt"]
CURRENT = re.compile(r'<link rel="canonical" href="([^"]+)">')

def current():
    with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
        m = CURRENT.search(f.read())
    if not m:
        sys.exit("No canonical link found in index.html.")
    return m.group(1)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("url", nargs="?", help="New address, with a trailing slash.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--show", action="store_true")
    a = ap.parse_args()
    old = current()
    if a.show or not a.url:
        print(old); return
    new = a.url if a.url.endswith("/") else a.url + "/"
    if not re.match(r"^https://[^/\s]+(/[^\s]*)?$", new):
        sys.exit("The new address must start with https:// and have no spaces.")
    total = 0
    for name in FILES:
        path = os.path.join(ROOT, name)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        n = text.count(old)
        total += n
        print(f"{name:14} {n} occurrence(s)")
        if n and not a.dry_run:
            with open(path, "w", encoding="utf-8") as f:
                f.write(text.replace(old, new))
    print(("Would change" if a.dry_run else "Changed"), total, "occurrence(s):", old, "->", new)

if __name__ == "__main__":
    main()
