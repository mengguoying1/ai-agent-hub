#!/usr/bin/env python3
"""Add the Editorial Policy link to every page footer, idempotently.

Inserts ' · <a href="editorial-policy.html">Editorial policy</a>' right after
the footer Methodology link. Pages without a footer Methodology link are
reported, not guessed at. Re-runs do nothing.
"""
import io, os

ROOT = r"D:\Desktop\coding\ai-agent-hub"
os.chdir(ROOT)

ANCHOR = '<a href="methodology.html">Methodology</a>'
INJECT = ' · <a href="editorial-policy.html">Editorial policy</a>'

added, already, missing = [], [], []
for fn in sorted(f for f in os.listdir(".") if f.endswith(".html")):
    s = io.open(fn, encoding="utf-8").read()
    if "editorial-policy.html" in s:
        already.append(fn)
        continue
    new = s
    if ANCHOR in s:
        new = s.replace(ANCHOR, ANCHOR + INJECT)
    elif '<a href="privacy.html">Privacy Policy</a>' in s:
        # older multi-line footer format
        new = s.replace('<a href="privacy.html">Privacy Policy</a>',
                        '<a href="privacy.html">Privacy Policy</a> · <a href="editorial-policy.html">Editorial Policy</a>')
    if new != s:
        io.open(fn, "w", encoding="utf-8", newline="\n").write(new)
        added.append(fn)
    else:
        missing.append(fn)

print("added %d, already-linked %d, no-anchor %d" % (len(added), len(already), len(missing)))
if missing:
    print("NO ANCHOR (footer format unknown or minimal footer):")
    for m in missing:
        print("  " + m)
