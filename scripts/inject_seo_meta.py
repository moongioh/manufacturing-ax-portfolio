# -*- coding: utf-8 -*-
"""Inject SEO/GEO head metadata into every portfolio page + emit sitemap.xml.

Idempotent: pages that already carry <meta name="description"> are skipped.
Run from repo root:  python scripts/inject_seo_meta.py
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://moongioh.github.io/manufacturing-ax-portfolio/"
SITE_NAME = "Manufacturing AX Portfolio"
AUTHOR = {
    "@type": "Person",
    "name": "moongioh",
    "email": "awsgioh@gmail.com",
    "url": BASE,
    "sameAs": [
        "https://github.com/moongioh",
        "https://github.com/moongioh/harness-scope",
    ],
    "jobTitle": "Forward Deployed Engineer / AX Engineer",
}

TAG_RE = re.compile(r"<[^>]+>")
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S)
P_RE = re.compile(r"<p\b[^>]*>(.*?)</p>", re.S)


def visible_text(fragment: str) -> str:
    txt = TAG_RE.sub("", fragment)
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def first_description(src: str, fallback: str) -> str:
    for m in P_RE.finditer(src):
        txt = visible_text(m.group(1))
        if len(txt) >= 40:
            return txt[:157] + ("…" if len(txt) > 157 else "")
    return fallback


def git_lastmod(path: Path) -> str:
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(path.relative_to(ROOT))],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
        return out or "2026-07-11"
    except Exception:
        return "2026-07-11"


def head_block(title: str, desc: str, url: str, og_type: str, jsonld: dict) -> str:
    e = lambda s: html.escape(s, quote=True)
    lines = [
        f'<meta name="description" content="{e(desc)}" />',
        f'<link rel="canonical" href="{url}" />',
        f'<meta property="og:type" content="{og_type}" />',
        f'<meta property="og:title" content="{e(title)}" />',
        f'<meta property="og:description" content="{e(desc)}" />',
        f'<meta property="og:url" content="{url}" />',
        f'<meta property="og:site_name" content="{SITE_NAME}" />',
        '<meta property="og:locale" content="ko_KR" />',
        '<meta name="twitter:card" content="summary" />',
        '<script type="application/ld+json">'
        + json.dumps(jsonld, ensure_ascii=False)
        + "</script>",
    ]
    return "\n".join(lines)


def page_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE
    return BASE + quote(rel)


def jsonld_for(path: Path, title: str, desc: str, url: str, lastmod: str) -> tuple[dict, str]:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return ({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": SITE_NAME,
            "url": BASE,
            "description": desc,
            "inLanguage": "ko",
            "author": AUTHOR,
        }, "website")
    if rel == "resume.html":
        return ({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": title,
            "url": url,
            "description": desc,
            "inLanguage": "ko",
            "dateModified": lastmod,
            "mainEntity": AUTHOR,
        }, "profile")
    return ({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": title,
        "url": url,
        "description": desc,
        "inLanguage": "ko",
        "dateModified": lastmod,
        "author": AUTHOR,
        "isPartOf": {"@type": "WebSite", "name": SITE_NAME, "url": BASE},
    }, "article")


def process(path: Path) -> str:
    raw = path.read_bytes()
    bom = raw.startswith(b"\xef\xbb\xbf")
    src = raw.decode("utf-8-sig")
    if 'name="description"' in src:
        return "skip (has description)"
    m = TITLE_RE.search(src)
    if not m:
        return "SKIP: no <title>"
    title = visible_text(m.group(1))
    desc = first_description(src[m.end():], f"{title} — {SITE_NAME}")
    url = page_url(path)
    lastmod = git_lastmod(path)
    jsonld, og_type = jsonld_for(path, title, desc, url, lastmod)
    block = head_block(title, desc, url, og_type, jsonld)
    out = src[: m.end()] + "\n" + block + src[m.end():]
    data = out.encode("utf-8")
    if bom:
        data = b"\xef\xbb\xbf" + data
    path.write_bytes(data)
    return "injected"


def write_sitemap(pages: list[Path]) -> None:
    items = []
    for p in pages:
        items.append(
            "  <url><loc>{}</loc><lastmod>{}</lastmod></url>".format(
                page_url(p), git_lastmod(p)
            )
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(items)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")


def main() -> None:
    pages = [ROOT / "index.html", ROOT / "resume.html"] + sorted(
        (ROOT / "walkthroughs").glob("*.html")
    )
    for p in pages:
        print(f"{p.relative_to(ROOT)}: {process(p)}")
    write_sitemap(pages)
    print(f"sitemap.xml: {len(pages)} urls")


if __name__ == "__main__":
    sys.exit(main())
