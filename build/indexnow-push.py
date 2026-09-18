#!/usr/bin/env python3
"""Push URLs to IndexNow (Bing, Yandex, Seznam, Naver) so new pages are
crawled in minutes instead of waiting for a scheduled crawl.

Usage
  python build/indexnow-push.py                 # every URL in sitemap.xml
  python build/indexnow-push.py debate.html     # just these paths
  python build/indexnow-push.py --new           # URLs added in the last commit

The key file must stay published at the root: it is how the endpoint verifies
that this site actually owns the key being presented.
"""
import json, os, re, subprocess, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(ROOT)

HOST = "www.waiagent.win"
ENDPOINT = "https://api.indexnow.org/indexnow"


def find_key():
    for f in os.listdir("."):
        if re.fullmatch(r"[a-f0-9]{32}\.txt", f):
            return f[:-4]
    sys.exit("No IndexNow key file found. Run build/gen-discovery.py first.")


def from_sitemap():
    s = open("sitemap.xml", encoding="utf-8").read()
    return re.findall(r"<loc>(.*?)</loc>", s)


def from_git():
    out = subprocess.run(["git", "show", "--name-status", "--pretty=format:", "HEAD"],
                         capture_output=True, text=True).stdout
    urls = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) == 2 and parts[1].endswith((".html", ".txt")) and not parts[1].startswith("build/"):
            urls.append("https://%s/%s" % (HOST, parts[1]))
    return urls


def push(urls, key):
    body = json.dumps({
        "host": HOST,
        "key": key,
        "keyLocation": "https://%s/%s.txt" % (HOST, key),
        "urlList": urls,
    }).encode("utf-8")
    req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}

    if args:
        urls = ["https://%s/%s" % (HOST, p.lstrip("/")) for p in args]
    elif "--new" in flags:
        urls = from_git()
    else:
        urls = from_sitemap()

    urls = list(dict.fromkeys(urls))
    if not urls:
        sys.exit("Nothing to submit.")

    key = find_key()
    print("Submitting %d URLs to IndexNow (key %s…)" % (len(urls), key[:8]))
    status, text = push(urls, key)
    # IndexNow answers 200 for accepted, 202 for queued; 400 means malformed key.
    if status in (200, 202):
        print("OK %s — accepted." % status)
    else:
        print("HTTP %s: %s" % (status, text[:400]))
        sys.exit(1)


if __name__ == "__main__":
    main()
