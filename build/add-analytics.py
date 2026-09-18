#!/usr/bin/env python3
"""Install the Cloudflare Web Analytics beacon across the site.

The domain is managed at Cloudflare but the DNS records are DNS-only (grey
cloud), so traffic goes straight to GitHub Pages. That means the built-in
Cloudflare traffic analytics, which require the proxy, report nothing. The
standalone Web Analytics product still works: it is a JS beacon and does not
need the proxy, cookies, or a consent banner.

Usage
-----
1. Create the site in the Cloudflare dashboard and copy its 32-character token.
2. Paste that token into build/analytics-token.txt (this file is gitignored if
   you would rather keep it private; the token is not a secret credential, it
   only identifies which dashboard bucket receives the measurements).
3. Run:  python build/add-analytics.py

The script is idempotent: re-running it updates an existing beacon rather than
adding a second one.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

TOKEN_FILE = os.path.join("build", "analytics-token.txt")

# Pages that must keep their exact byte content.
EXCLUDE = {"google00919b0deaa106f6.html"}

BEACON = (
    "<!-- Cloudflare Web Analytics -->"
    "<script defer src='https://static.cloudflareinsights.com/beacon.min.js' "
    'data-cf-beacon=\'{"token": "%s"}\'></script>'
    "<!-- End Cloudflare Web Analytics -->"
)

# Matches an existing beacon so a re-run replaces it instead of duplicating.
BEACON_RE = re.compile(
    r"[ \t]*<!-- Cloudflare Web Analytics -->.*?<!-- End Cloudflare Web Analytics -->\n?",
    re.S,
)


def read_token():
    if not os.path.exists(TOKEN_FILE):
        return None
    with io.open(TOKEN_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                return line
    return None


def main():
    token = read_token()
    if not token:
        sys.exit(
            "No token found.\n"
            "Create the site in Cloudflare (Web Analytics > Add a site), copy the\n"
            "32-character token, paste it into %s, then run this script again." % TOKEN_FILE
        )
    if not re.fullmatch(r"[0-9a-f]{32}", token):
        sys.exit(
            "That does not look like a Cloudflare beacon token.\n"
            "Expected 32 lowercase hex characters, got: %r" % token
        )

    snippet = BEACON % token
    added, updated, skipped, failed = 0, 0, 0, []

    for fn in sorted(f for f in os.listdir(".") if f.endswith(".html")):
        if fn in EXCLUDE:
            skipped += 1
            continue
        s = io.open(fn, encoding="utf-8").read()
        if "</body>" not in s:
            failed.append((fn, "no </body>"))
            continue

        if "static.cloudflareinsights.com" in s:
            new = BEACON_RE.sub(snippet + "\n", s, count=1)
            # Guard against a beacon whose comment markers were stripped.
            if new == s:
                new = re.sub(
                    r"[ \t]*<script defer src='https://static\.cloudflareinsights\.com[^>]*></script>\n?",
                    snippet + "\n", s, count=1)
            if new == s:
                skipped += 1
                continue
            io.open(fn, "w", encoding="utf-8", newline="\n").write(new)
            updated += 1
        else:
            new = s.replace("</body>", snippet + "\n</body>", 1)
            io.open(fn, "w", encoding="utf-8", newline="\n").write(new)
            added += 1

    print("beacon added to %d pages, updated on %d, skipped %d" % (added, updated, skipped))
    if failed:
        print("FAILED: %s" % failed)


if __name__ == "__main__":
    main()
