# -*- coding: utf-8 -*-
"""AdSense readiness pass.

Two problems this fixes:

1. The AdSense tag was present on only 15 of 59 pages. Auto ads can only
   operate on pages that carry the tag, so most of the site was invisible to
   it. The tag is now added to every page eligible to show ads.

2. The four archived pages carry a "does not request advertising" notice but
   still contained an ad slot. The slots are removed so the markup matches
   what the page claims, and so thin noindex pages stop factoring into a
   low-value-content review.

Run from the repository root:  python build/adsense-readiness.py
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

CLIENT = 'ca-pub-5803262792097019'
TAG = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/'
       'adsbygoogle.js?client=%s" crossorigin="anonymous"></script>' % CLIENT)

# Pages that must never carry the ad tag.
EXCLUDE = {
    'google00919b0deaa106f6.html',  # Search Console verification file
    '404.html',                     # error page, no content
    'privacy.html', 'terms.html',   # legal pages
    'contact.html',                 # no content to advertise against
}

AD_SLOT_RE = re.compile(r'[ \t]*<div class="ad-slot" data-ad="[^"]*"></div>\n?')


def words(html):
    body = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.S)
    return len(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', body)).split())


def is_noindex(html):
    return re.search(r'name="robots"\s+content="noindex', html) is not None


def main():
    added, removed, skipped = [], [], []

    for fn in sorted(f for f in os.listdir('.') if f.endswith('.html')):
        with io.open(fn, encoding='utf-8') as f:
            s = f.read()

        if is_noindex(s):
            # Strip slots: these pages say they do not request advertising.
            new = AD_SLOT_RE.sub('', s)
            if new != s:
                with io.open(fn, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(new)
                removed.append(fn)
            s = new

        if fn in EXCLUDE:
            skipped.append((fn, 'excluded by policy'))
            continue

        if is_noindex(s):
            # Archived pages are excluded from search and say so on the page.
            # Serving ads from them adds nothing and puts thin, superseded
            # content in front of a low-value-content review.
            skipped.append((fn, 'noindex archived page'))
            continue

        if 'pagead2.googlesyndication.com' in s:
            continue  # already present

        if '</head>' not in s:
            skipped.append((fn, 'no </head> to insert before'))
            continue

        if words(s) < 300:
            skipped.append((fn, 'under 300 words (%d)' % words(s)))
            continue

        s = s.replace('</head>', '  ' + TAG + '\n</head>', 1)
        with io.open(fn, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)
        added.append((fn, words(s)))

    print('ad tag added to %d pages' % len(added))
    print('ad slots removed from %d archived pages: %s'
          % (len(removed), ', '.join(removed) or 'none'))
    if skipped:
        print('\nskipped:')
        for fn, why in skipped:
            print('  -', fn, '->', why)

    total = sum(1 for f in os.listdir('.') if f.endswith('.html')
                if 'pagead2.googlesyndication.com' in io.open(f, encoding='utf-8').read())
    print('\npages now carrying the ad tag: %d' % total)
    return 0


if __name__ == '__main__':
    sys.exit(main())
