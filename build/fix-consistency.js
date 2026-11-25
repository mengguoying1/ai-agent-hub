/*
 * fix-consistency.js — one-off sitewide consistency repair (2026-11-25)
 *
 * 1. Unifies the top-nav on every page to the canonical order:
 *      Home → Guides → Debate → Tools → Methodology · Editorial policy → Author
 *    (index.html keeps its #models/#pricing anchors first.)
 * 2. Rewrites sitemap.xml <lastmod> from each file's real git history
 *    (was: every URL stamped 2026-09-18..20, hiding the November refresh).
 * 3. Unifies the css/style.css?v= cache-buster string.
 *
 * Idempotent: re-running makes no further changes. Run from repo root:
 *   node build/fix-consistency.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CSS_V = '20260810e'; // matches css/style.css last real change (git: 2026-08-10)

const NAV_ITEMS = [
  ['Home', './'],
  ['Guides', 'articles.html'],
  ['Debate', 'debate.html'],
  ['Tools', 'category-tools.html'],
];
const NAV_TAIL = [
  '<li><a href="methodology.html">Methodology</a> · <a href="editorial-policy.html">Editorial policy</a></li>',
  '<li><a href="about-author.html">Author</a></li>',
];

const NAV_SINGLE =
  '<ul class="nav-links">' +
  NAV_ITEMS.map(([t, h]) => '<li><a href="' + h + '">' + t + '</a></li>').join('') +
  NAV_TAIL.join('') + '</ul>';

function navMultiline(indent, isIndex, nl) {
  const items = [];
  if (isIndex) {
    // Homepage: section anchors first; "Home" omitted (logo already links home).
    items.push('<li><a href="#models">Models</a></li>', '<li><a href="#pricing">Pricing</a></li>');
    for (const [t, h] of NAV_ITEMS.slice(1)) items.push('<li><a href="' + h + '">' + t + '</a></li>');
  } else {
    for (const [t, h] of NAV_ITEMS) items.push('<li><a href="' + h + '">' + t + '</a></li>');
  }
  items.push(...NAV_TAIL);
  return '<ul class="nav-links">' + nl + items.map((i) => indent + '  ' + i).join(nl) +
    nl + indent + '</ul>';
}

let navFixed = 0, cssFixed = 0;
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const f of files) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  // --- 1a. single-line nav: any variant on one line ---
  s = s.replace(/<ul class="nav-links">.*?<\/ul>/, () => NAV_SINGLE);

  // --- 1b. multi-line nav block: derive indent from the following </div> ---
  // (robust even if the <ul> lost its own indentation on a previous run)
  s = s.replace(
    /(^|\r?\n)[ \t]*<ul class="nav-links">(\r?\n)[\s\S]*?<\/ul>(\r?\n)([ \t]*)<\/div>/,
    (m, lineStart, nl, nl2, divIndent) => {
      const ulIndent = divIndent + '  ';
      return lineStart + ulIndent + navMultiline(ulIndent, f === 'index.html', nl) + nl2 + divIndent + '</div>';
    }
  );

  // --- 3. css cache-buster unify ---
  s = s.replace(/css\/style\.css\?v=[a-z0-9]+/g, 'css/style.css?v=' + CSS_V);

  if (s !== before) {
    fs.writeFileSync(p, s);
    navFixed++;
    if (before.match(/css\/style\.css\?v=(?!20260810e)/)) cssFixed++;
  }
}

// --- 2. sitemap lastmod from git history ---
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
let smFixed = 0, smMissing = [];
sm = sm.replace(
  /<loc>https:\/\/www\.waiagent\.win\/([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g,
  (m, urlPath, oldDate) => {
    const file = urlPath === '' ? 'index.html' : urlPath;
    if (!fs.existsSync(path.join(ROOT, file))) { smMissing.push(urlPath); return m; }
    let d;
    try {
      d = execSync('git log -1 --format=%ad --date=short -- "' + file + '"', { cwd: ROOT })
        .toString().trim();
    } catch (e) { return m; }
    if (!d || d === oldDate) return m;
    smFixed++;
    return m.replace('<lastmod>' + oldDate + '</lastmod>', '<lastmod>' + d + '</lastmod>');
  }
);
fs.writeFileSync(smPath, sm);

console.log('nav unified on ' + navFixed + ' pages (css string fixed on ' + cssFixed + ')');
console.log('sitemap lastmod corrected: ' + smFixed + ' entries');
if (smMissing.length) console.log('sitemap URLs with no local file (left as-is): ' + smMissing.join(', '));
