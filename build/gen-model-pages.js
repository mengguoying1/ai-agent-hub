/* Generate programmatic long-tail pages from js/model-data.js:
 *   model-<id>.html              one verified pricing page per model
 *   compare-<a>-vs-<b>.html      head-to-head cost pages for selected pairs
 *   model-pricing.html           hub indexing all of the above
 * Also patches sitemap.xml and llms.txt. Idempotent: safe to re-run.
 *
 * Run: node build/gen-model-pages.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = require(path.join(ROOT, 'js', 'model-data.js'));
const MODELS = DATA.models;
const HOST = 'https://www.waiagent.win';
const TODAY_ISO = '2026-09-20';
const TODAY_HUMAN = 'September 20, 2026';
const VERIFIED_HUMAN = 'September 18, 2026';

/* Cache-write billing assumption per provider, stated on every page. */
const WRITE_MULT = { 'Anthropic': 1.25, 'OpenAI': 1.25, 'Google DeepMind': 1.0, 'DeepSeek': 1.0 };
const WRITE_NOTE = {
  'Anthropic': 'cache writes bill at 1.25x the input rate',
  'OpenAI': 'cache writes bill at 1.25x the uncached input rate',
  'Google DeepMind': 'cache writes bill at the input rate (per-hour cache storage is excluded)',
  'DeepSeek': 'cache writes bill at the standard input rate'
};

/* Head-to-head pairs, chosen for search intent (same tier / same list price). */
const PAIRS = [
  ['claude-fable-51', 'gpt-6-astra'],
  ['claude-sonnet-5', 'gpt-56-sol'],
  ['claude-opus-5', 'gpt-56-sol'],
  ['gemini-31-pro', 'gpt-56-terra'],
  ['gpt-56-luna', 'gemini-38-flash'],
  ['gpt-56-luna', 'deepseek-v41-flash'],
  ['gemini-38-flash', 'deepseek-v41-flash'],
  ['claude-haiku-45', 'gemini-38-flash']
];

/* ------------------------------------------------------------------ math */
function fmt(n) {
  const digits = n < 0.01 ? 4 : (n < 0.1 ? 3 : 2);
  return '$' + n.toFixed(digits);
}
function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function ctx(m) { return m.contextDisplay || (m.contextK >= 1000 ? (m.contextK / 1000) + 'M' : m.contextK + 'K'); }
function byId(id) { return MODELS.find(m => m.id === id); }

/* Scenario A: 200-step agent task. 40K stable prefix written once on step 1,
 * re-read on the remaining 199 steps, 500 output tokens per step. Matches the
 * worked bill in article-cache-price-war-september-2026.html. Google bills
 * cache by hourly storage instead of a write charge, so its write shows 0. */
function agentTask(m) {
  const isGoogle = m.company === 'Google DeepMind';
  const write = isGoogle ? 0 : 40000 * m.inputPrice * WRITE_MULT[m.company] / 1e6;
  const reads = 199 * 40000 * m.cacheReadPrice / 1e6;
  const out = 200 * 500 * m.outputPrice / 1e6;
  return { write, reads, out, total: write + reads + out, isGoogle };
}

/* Scenario B: one heavy month = 50M fresh input + 150M cached input + 10M output. */
function heavyMonth(m) {
  const fresh = 50 * m.inputPrice;
  const cached = 150 * m.cacheReadPrice;
  const out = 10 * m.outputPrice;
  return { fresh, cached, out, total: fresh + cached + out };
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* --------------------------------------------------------------- skeleton */
function head(opts) {
  const jsonld = opts.jsonld.map(o => '<script type="application/ld+json">' + JSON.stringify(o) + '</script>').join('');
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5803262792097019" crossorigin="anonymous"></script>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="description" content="' + esc(opts.description) + '">' +
    '<meta name="robots" content="index, follow">' +
    '<link rel="canonical" href="' + HOST + '/' + opts.slug + '">' +
    '<link rel="alternate" type="application/rss+xml" title="AI Agent Hub Guides" href="feed.xml">' +
    '<link rel="icon" href="favicon.svg">' +
    '<title>' + esc(opts.title) + '</title>' +
    '<meta property="og:image" content="' + HOST + '/assets/og-default.png">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:image" content="' + HOST + '/assets/og-default.png">' +
    '<link rel="stylesheet" href="css/style.css?v=20260810e">' + jsonld + '</head>' +
    '<body class="article-page">\n<a class="skip-link" href="#main-content">Skip to main content</a>\n' +
    '<nav class="nav" aria-label="Primary navigation"><div class="nav-inner"><a href="./" class="nav-logo">AI <span>Agent Hub</span></a><ul class="nav-links"><li><a href="./">Home</a></li><li><a href="articles.html">Guides</a></li><li><a href="debate.html">Debate</a></li><li><a href="category-tools.html">Tools</a></li><li><a href="methodology.html">Methodology</a> · <a href="editorial-policy.html">Editorial policy</a></li></ul></div></nav>\n';
}
const FOOTER = '</main>\n<footer class="footer"><p>© 2026 AI Agent Hub.</p><div class="policy-links"><a href="about-author.html">Editorial desk</a> · <a href="methodology.html">Methodology</a> · <a href="editorial-policy.html">Editorial policy</a> · <a href="privacy.html">Privacy</a> · <a href="contact.html">Corrections</a></div></footer><script src="js/ads.js?v=20260918a"></script>\n' +
  '<!-- Cloudflare Web Analytics --><script type=\'module\' src=\'https://static.cloudflareinsights.com/beacon.min.js\' data-cf-beacon=\'{"token": "8d2f3ff402aa4df8a8479a2ca8886792"}\'></script><!-- End Cloudflare Web Analytics -->\n</body></html>\n';

const BYLINE = '<p class="article-byline">By <a href="about-author.html">AI Agent Hub Editorial Desk</a> · <a href="methodology.html">Review method</a> · <a href="contact.html">Corrections</a></p>\n';

function articleLd(headline, slug) {
  return {
    '@context': 'https://schema.org', '@type': 'Article', headline,
    author: { '@type': 'Organization', name: 'AI Agent Hub Editorial Desk', url: HOST + '/about-author.html' },
    publisher: { '@type': 'Organization', name: 'AI Agent Hub' },
    datePublished: TODAY_ISO, dateModified: TODAY_ISO, mainEntityOfPage: HOST + '/' + slug
  };
}
function faqLd(qas) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: qas.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } }))
  };
}

/* ------------------------------------------------------------- model page */
function compareSlug(a, b) { return 'compare-' + a.id + '-vs-' + b.id + '.html'; }
function pairsOf(m) { return PAIRS.filter(p => p[0] === m.id || p[1] === m.id).map(p => p[0] === m.id ? [m, byId(p[1])] : [byId(p[0]), m]); }

function modelPage(m) {
  const slug = 'model-' + m.id + '.html';
  const task = agentTask(m);
  const month = heavyMonth(m);
  const pricePair = fmt(m.inputPrice) + ' / ' + fmt(m.outputPrice);
  const myPairs = pairsOf(m);
  const siblings = MODELS.filter(x => x.company === m.company && x.id !== m.id);

  const qas = [
    { q: 'How much does ' + m.name + ' cost per million tokens?',
      a: m.name + ' costs ' + fmt(m.inputPrice) + ' per 1M input tokens and ' + fmt(m.outputPrice) + ' per 1M output tokens, with cached input at ' + fmt(m.cacheReadPrice) + ' per 1M. Verified ' + VERIFIED_HUMAN + ' against ' + m.company + "'s official pricing." },
    { q: 'What is the context window of ' + m.name + '?',
      a: m.name + ' supports a ' + ctx(m) + ' token context window, per ' + m.company + "'s documentation checked " + VERIFIED_HUMAN + '.' },
    { q: 'Does ' + m.name + ' support prompt caching?',
      a: 'Yes. Cached input tokens bill at ' + fmt(m.cacheReadPrice) + ' per 1M instead of the full input rate; ' + WRITE_NOTE[m.company] + '.' },
    { q: 'When was this ' + m.name + ' price last checked?',
      a: 'On ' + VERIFIED_HUMAN + ', against ' + m.company + "'s own pricing page: " + m.sourceUrl }
  ];

  let html = head({
    slug,
    title: m.name + ' API Pricing: ' + pricePair + ' per 1M Tokens (Sep 2026)',
    description: m.name + ' costs ' + fmt(m.inputPrice) + ' input / ' + fmt(m.outputPrice) + ' output per 1M tokens, cache reads ' + fmt(m.cacheReadPrice) + ', ' + ctx(m) + ' context. Verified ' + VERIFIED_HUMAN + ' against ' + m.company + ' documentation, with worked agent-workload cost examples.',
    jsonld: [articleLd(m.name + ' API Pricing: ' + pricePair + ' per 1M Tokens', slug), faqLd(qas)]
  });

  html += '<main id="main-content"><div class="meta">Model pricing reference · Verified ' + VERIFIED_HUMAN + '</div>\n';
  html += '<h1>' + esc(m.name) + ' API Pricing: ' + pricePair + ' per 1M Tokens</h1>\n' + BYLINE;
  html += '<div class="highlight-box"><p><strong>The numbers:</strong> ' + esc(m.name) + ' (' + esc(m.company) + ') bills <strong>' + fmt(m.inputPrice) + '</strong> per 1M input tokens, <strong>' + fmt(m.outputPrice) + '</strong> per 1M output tokens, and <strong>' + fmt(m.cacheReadPrice) + '</strong> per 1M cached input tokens, inside a ' + ctx(m) + ' context window. On our reference 200-step agent workload that works out to about <strong>' + fmtMoney(task.total) + '</strong> per task.</p></div>\n';

  html += '<p>' + esc(m.strengths) + '. Every figure on this page was read directly from ' + esc(m.company) + '&rsquo;s own documentation on ' + VERIFIED_HUMAN + ' &mdash; not copied from a third-party comparison table. Rates change; the source link and check date below are part of the data.</p>\n';

  html += '<h2>Verified rates</h2>\n<table><thead><tr><th>Item</th><th>Rate</th><th>Unit</th></tr></thead><tbody>\n' +
    '<tr><td>Input</td><td>' + fmt(m.inputPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Output</td><td>' + fmt(m.outputPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Cached input (cache read)</td><td>' + fmt(m.cacheReadPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Context window</td><td>' + ctx(m) + '</td><td>tokens</td></tr>\n' +
    '</tbody></table>\n';
  if (m.priceNote) html += '<p><strong>Billing notes:</strong> ' + esc(m.priceNote) + '</p>\n';
  html += '<p>Source: <a href="' + m.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + esc(m.company) + ' official pricing &#8599;</a>, checked ' + VERIFIED_HUMAN + '.</p>\n';

  html += '<h2>What a real workload costs on ' + esc(m.name) + '</h2>\n';
  html += '<p>List rates are not bills. These two reference workloads translate the table above into money. The assumptions are visible so you can swap in your own trace &mdash; the <a href="tool-cost-calculator.html">cost calculator</a> does exactly that.</p>\n';
  html += '<h3>Scenario A &mdash; one 200-step agent task</h3>\n';
  html += '<p>A coding agent runs 200 steps against a stable 40,000-token prefix (system prompt, tools, repository map). The prefix is written to cache on the first step, re-read on the remaining 199, and each step produces 500 output tokens. For ' + esc(m.company) + ', ' + WRITE_NOTE[m.company] + '.</p>\n';
  const writeCell = task.isGoogle ? '<td>&mdash;</td>' : '<td>' + fmtMoney(task.write) + '</td>';
  const writeCalc = task.isGoogle ? 'billed via hourly cache storage (excluded)' : '40,000 tokens &times; ' + fmt(m.inputPrice * WRITE_MULT[m.company]) + ' / 1M';
  html += '<table><thead><tr><th>Component</th><th>Calculation</th><th>Cost</th></tr></thead><tbody>\n' +
    '<tr><td>Cache write (once)</td><td>' + writeCalc + '</td>' + writeCell + '</tr>\n' +
    '<tr><td>Cache reads</td><td>199 &times; 40,000 &times; ' + fmt(m.cacheReadPrice) + ' / 1M</td><td>' + fmtMoney(task.reads) + '</td></tr>\n' +
    '<tr><td>Output</td><td>200 &times; 500 &times; ' + fmt(m.outputPrice) + ' / 1M</td><td>' + fmtMoney(task.out) + '</td></tr>\n' +
    '<tr><td><strong>Total per task</strong></td><td></td><td><strong>' + fmtMoney(task.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';
  html += '<h3>Scenario B &mdash; one heavy month</h3>\n';
  html += '<p>A production service pushes 50M fresh input tokens, 150M cached input tokens, and 10M output tokens through ' + esc(m.name) + ' in a month:</p>\n';
  html += '<table><thead><tr><th>Component</th><th>Volume</th><th>Cost</th></tr></thead><tbody>\n' +
    '<tr><td>Fresh input</td><td>50M &times; ' + fmt(m.inputPrice) + '</td><td>' + fmtMoney(month.fresh) + '</td></tr>\n' +
    '<tr><td>Cached input</td><td>150M &times; ' + fmt(m.cacheReadPrice) + '</td><td>' + fmtMoney(month.cached) + '</td></tr>\n' +
    '<tr><td>Output</td><td>10M &times; ' + fmt(m.outputPrice) + '</td><td>' + fmtMoney(month.out) + '</td></tr>\n' +
    '<tr><td><strong>Monthly total</strong></td><td></td><td><strong>' + fmtMoney(month.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';
  if (m.company === 'DeepSeek') html += '<p>DeepSeek rates above are off-peak; weekday peak hours (01:00&ndash;04:00 and 06:00&ndash;10:00 UTC) double the input and output rates.</p>\n';

  if (myPairs.length) {
    html += '<h2>Head-to-head cost comparisons</h2>\n<ul>\n';
    for (const [a, b] of myPairs) {
      const ta = agentTask(a).total, tb = agentTask(b).total;
      const ratio = (Math.max(ta, tb) / Math.min(ta, tb));
      html += '<li><a href="' + compareSlug(a, b) + '">' + esc(a.name) + ' vs ' + esc(b.name) + '</a> &mdash; same workload, ' + fmtMoney(ta) + ' vs ' + fmtMoney(tb) + ' (' + ratio.toFixed(1) + 'x apart).</li>\n';
    }
    html += '</ul>\n';
  }

  html += '<h2>Frequently asked questions</h2>\n';
  for (const { q, a } of qas) html += '<h3>' + esc(q) + '</h3>\n<p>' + esc(a) + '</p>\n';

  html += '<h2>Keep digging</h2>\n<div class="related-links"><strong>Related:</strong> ' +
    '<a href="tool-cost-calculator.html">AI API cost calculator</a> · ' +
    '<a href="article-cache-price-war-september-2026.html">The September 2026 cache price war</a> · ' +
    '<a href="model-pricing.html">All verified model pricing</a>' +
    (siblings.length ? ' · Also from ' + esc(m.company) + ': ' + siblings.map(s => '<a href="model-' + s.id + '.html">' + esc(s.name) + '</a>').join(', ') : '') +
    '</div>\n';
  html += '<div class="ad-slot" data-ad="article-end"></div>\n';

  return html + FOOTER;
}

/* ------------------------------------------------------------ compare page */
function comparePage(a, b) {
  const slug = compareSlug(a, b);
  const ta = agentTask(a), tb = agentTask(b);
  const ma = heavyMonth(a), mb = heavyMonth(b);
  const cheaper = ta.total <= tb.total ? a : b;
  const dearer = ta.total <= tb.total ? b : a;
  const ratio = Math.max(ta.total, tb.total) / Math.min(ta.total, tb.total);
  const sameList = a.inputPrice === b.inputPrice && a.outputPrice === b.outputPrice;

  let verdict;
  if (sameList) {
    verdict = esc(a.name) + ' and ' + esc(b.name) + ' publish identical list rates (' + fmt(a.inputPrice) + ' / ' + fmt(a.outputPrice) + '), but identical list rates do not mean identical bills: on our 200-step agent workload the two land ' + ratio.toFixed(1) + 'x apart (' + fmtMoney(ta.total) + ' vs ' + fmtMoney(tb.total) + '), driven entirely by the cache-read row.';
  } else {
    verdict = 'On our reference 200-step agent workload, ' + esc(cheaper.name) + ' bills ' + fmtMoney(Math.min(ta.total, tb.total)) + ' against ' + fmtMoney(Math.max(ta.total, tb.total)) + ' for ' + esc(dearer.name) + ' &mdash; ' + ratio.toFixed(1) + 'x apart. List rates alone would not have told you that.';
  }

  const qas = [
    { q: 'Is ' + a.name + ' cheaper than ' + b.name + '?',
      a: 'On list rates, ' + a.name + ' costs ' + fmt(a.inputPrice) + '/' + fmt(a.outputPrice) + ' per 1M input/output tokens versus ' + fmt(b.inputPrice) + '/' + fmt(b.outputPrice) + ' for ' + b.name + '. On a 200-step agent workload (40K cached prefix, 500 output tokens per step), ' + cheaper.name + ' totals ' + fmtMoney(Math.min(ta.total, tb.total)) + ' versus ' + fmtMoney(Math.max(ta.total, tb.total)) + ' for ' + dearer.name + '. Prices verified ' + VERIFIED_HUMAN + '.' },
    { q: a.name + ' vs ' + b.name + ': which has the longer context window?',
      a: a.name + ' offers ' + ctx(a) + ' tokens; ' + b.name + ' offers ' + ctx(b) + ' tokens, per provider documentation checked ' + VERIFIED_HUMAN + '.' },
    { q: 'Where do these ' + a.name + ' and ' + b.name + ' prices come from?',
      a: 'Both rate cards were read from the providers\' own pricing pages on ' + VERIFIED_HUMAN + ': ' + a.sourceUrl + ' and ' + b.sourceUrl + '.' }
  ];

  let html = head({
    slug,
    title: a.name + ' vs ' + b.name + ': API Cost Compared (Sep 2026)',
    description: a.name + ' (' + fmt(a.inputPrice) + '/' + fmt(a.outputPrice) + ') vs ' + b.name + ' (' + fmt(b.inputPrice) + '/' + fmt(b.outputPrice) + ') per 1M tokens. Same workload priced on both: ' + fmtMoney(ta.total) + ' vs ' + fmtMoney(tb.total) + '. Rates verified ' + VERIFIED_HUMAN + '.',
    jsonld: [articleLd(a.name + ' vs ' + b.name + ': API Cost Compared', slug), faqLd(qas)]
  });

  html += '<main id="main-content"><div class="meta">Head-to-head cost comparison · Verified ' + VERIFIED_HUMAN + '</div>\n';
  html += '<h1>' + esc(a.name) + ' vs ' + esc(b.name) + ': API Cost Compared</h1>\n' + BYLINE;
  html += '<div class="highlight-box"><p><strong>The verdict, in numbers:</strong> ' + verdict + '</p></div>\n';
  html += '<p>This page compares list rates and workload cost only. It does not tell you which model is <em>better</em> &mdash; capability belongs to your own evaluation. What it does give you is the half of the decision that can be verified: what each provider will actually charge, read from their own documentation on ' + VERIFIED_HUMAN + '.</p>\n';

  html += '<h2>Rate cards side by side</h2>\n<table><thead><tr><th>Item</th><th>' + esc(a.name) + '</th><th>' + esc(b.name) + '</th></tr></thead><tbody>\n' +
    '<tr><td>Provider</td><td>' + esc(a.company) + '</td><td>' + esc(b.company) + '</td></tr>\n' +
    '<tr><td>Input / 1M</td><td>' + fmt(a.inputPrice) + '</td><td>' + fmt(b.inputPrice) + '</td></tr>\n' +
    '<tr><td>Output / 1M</td><td>' + fmt(a.outputPrice) + '</td><td>' + fmt(b.outputPrice) + '</td></tr>\n' +
    '<tr><td>Cache read / 1M</td><td>' + fmt(a.cacheReadPrice) + '</td><td>' + fmt(b.cacheReadPrice) + '</td></tr>\n' +
    '<tr><td>Context window</td><td>' + ctx(a) + '</td><td>' + ctx(b) + '</td></tr>\n' +
    '</tbody></table>\n';
  html += '<p>Sources: <a href="' + a.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + esc(a.company) + ' pricing &#8599;</a> and <a href="' + b.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + esc(b.company) + ' pricing &#8599;</a>, both checked ' + VERIFIED_HUMAN + '.</p>\n';

  html += '<h2>The same 200-step agent task, priced twice</h2>\n';
  html += '<p>One coding-agent task: 200 steps, a stable 40,000-token prefix written to cache on step 1 and re-read on the remaining 199, 500 output tokens per step. Cache-write billing follows each provider&rsquo;s own rules (' + WRITE_NOTE[a.company] + '; ' + WRITE_NOTE[b.company] + ').</p>\n';
  const wA = ta.isGoogle ? '&mdash;' : fmtMoney(ta.write);
  const wB = tb.isGoogle ? '&mdash;' : fmtMoney(tb.write);
  html += '<table><thead><tr><th>Component</th><th>' + esc(a.name) + '</th><th>' + esc(b.name) + '</th></tr></thead><tbody>\n' +
    '<tr><td>Cache write (once)</td><td>' + wA + '</td><td>' + wB + '</td></tr>\n' +
    '<tr><td>Cache reads (199 &times; 40K)</td><td>' + fmtMoney(ta.reads) + '</td><td>' + fmtMoney(tb.reads) + '</td></tr>\n' +
    '<tr><td>Output (200 &times; 500)</td><td>' + fmtMoney(ta.out) + '</td><td>' + fmtMoney(tb.out) + '</td></tr>\n' +
    '<tr><td><strong>Total per task</strong></td><td><strong>' + fmtMoney(ta.total) + '</strong></td><td><strong>' + fmtMoney(tb.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';

  html += '<h2>A heavy month on each</h2>\n';
  html += '<p>50M fresh input, 150M cached input, 10M output tokens in a month:</p>\n';
  html += '<table><thead><tr><th>Component</th><th>' + esc(a.name) + '</th><th>' + esc(b.name) + '</th></tr></thead><tbody>\n' +
    '<tr><td>Fresh input (50M)</td><td>' + fmtMoney(ma.fresh) + '</td><td>' + fmtMoney(mb.fresh) + '</td></tr>\n' +
    '<tr><td>Cached input (150M)</td><td>' + fmtMoney(ma.cached) + '</td><td>' + fmtMoney(mb.cached) + '</td></tr>\n' +
    '<tr><td>Output (10M)</td><td>' + fmtMoney(ma.out) + '</td><td>' + fmtMoney(mb.out) + '</td></tr>\n' +
    '<tr><td><strong>Monthly total</strong></td><td><strong>' + fmtMoney(ma.total) + '</strong></td><td><strong>' + fmtMoney(mb.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';
  if (a.company === 'DeepSeek' || b.company === 'DeepSeek') html += '<p>DeepSeek figures use off-peak rates; weekday peak hours (01:00&ndash;04:00 and 06:00&ndash;10:00 UTC) double input and output.</p>\n';

  html += '<h2>What this comparison does and does not say</h2>\n';
  html += '<p><strong>' + esc(a.name) + ':</strong> ' + esc(a.strengths) + '.</p>\n';
  html += '<p><strong>' + esc(b.name) + ':</strong> ' + esc(b.strengths) + '.</p>\n';
  html += '<p>Cost is the verifiable half of the decision; quality is the half only your workload can answer. Run both candidates on a representative evaluation set and measure cost per <em>accepted</em> task &mdash; the <a href="article-llm-pricing.html">cost planning guide</a> walks through that method, and the <a href="tool-cost-calculator.html">calculator</a> lets you re-price this exact comparison with your own token mix.</p>\n';

  html += '<h2>Frequently asked questions</h2>\n';
  for (const { q, a: ans } of qas) html += '<h3>' + esc(q) + '</h3>\n<p>' + esc(ans) + '</p>\n';

  html += '<h2>Keep digging</h2>\n<div class="related-links"><strong>Full rate cards:</strong> <a href="model-' + a.id + '.html">' + esc(a.name) + ' pricing</a> · <a href="model-' + b.id + '.html">' + esc(b.name) + ' pricing</a> · <a href="model-pricing.html">All models</a> · <a href="article-cache-price-war-september-2026.html">Why cache prices moved in September 2026</a></div>\n';
  html += '<div class="ad-slot" data-ad="article-end"></div>\n';

  return html + FOOTER;
}

/* ---------------------------------------------------------------- hub page */
function hubPage() {
  const slug = 'model-pricing.html';
  const companies = [...new Set(MODELS.map(m => m.company))];
  let html = head({
    slug,
    title: 'AI Model Pricing Reference — Verified Rates & Head-to-Head Costs',
    description: 'Verified API pricing for ' + MODELS.length + ' current AI models from Anthropic, OpenAI, Google DeepMind, and DeepSeek — each with worked workload costs, plus ' + PAIRS.length + ' head-to-head cost comparisons. Checked ' + VERIFIED_HUMAN + '.',
    jsonld: [articleLd('AI Model Pricing Reference — Verified Rates & Head-to-Head Costs', slug)]
  });
  html += '<main id="main-content"><div class="meta">Model pricing reference · Verified ' + VERIFIED_HUMAN + '</div>\n';
  html += '<h1>AI Model Pricing Reference</h1>\n' + BYLINE;
  html += '<div class="highlight-box"><p><strong>What this is:</strong> one page per current model with verified rates and worked workload costs, plus head-to-head comparisons that price the same task twice. Every rate links to the provider&rsquo;s own documentation and carries its check date. Last full verification: ' + VERIFIED_HUMAN + '.</p></div>\n';

  html += '<h2>Model rate cards</h2>\n';
  for (const c of companies) {
    html += '<h3>' + esc(c) + '</h3>\n<ul>\n';
    for (const m of MODELS.filter(x => x.company === c)) {
      html += '<li><a href="model-' + m.id + '.html">' + esc(m.name) + '</a> &mdash; ' + fmt(m.inputPrice) + ' / ' + fmt(m.outputPrice) + ' per 1M, cache reads ' + fmt(m.cacheReadPrice) + ', ' + ctx(m) + ' context. A 200-step agent task bills about ' + fmtMoney(agentTask(m).total) + '.</li>\n';
    }
    html += '</ul>\n';
  }

  html += '<h2>Head-to-head comparisons</h2>\n<ul>\n';
  for (const [ia, ib] of PAIRS) {
    const a = byId(ia), b = byId(ib);
    html += '<li><a href="' + compareSlug(a, b) + '">' + esc(a.name) + ' vs ' + esc(b.name) + '</a> &mdash; ' + fmtMoney(agentTask(a).total) + ' vs ' + fmtMoney(agentTask(b).total) + ' on the same 200-step task.</li>\n';
  }
  html += '</ul>\n';

  html += '<h2>Method</h2>\n<p>Rates come from provider documentation, never from third-party comparison tables; the verification date is republished with every figure. Workload assumptions are stated on each page and reproducible in the <a href="tool-cost-calculator.html">cost calculator</a>. The verification workflow itself is documented in <a href="methodology.html">our methodology</a>, and corrections are logged publicly on the <a href="about.html">about page</a>.</p>\n';
  html += '<div class="ad-slot" data-ad="article-end"></div>\n';
  return html + FOOTER;
}

/* ------------------------------------------------------- sitemap / llms */
function patchSitemap(slugs) {
  const f = path.join(ROOT, 'sitemap.xml');
  let s = fs.readFileSync(f, 'utf8');
  let added = 0;
  let block = '';
  for (const slug of slugs) {
    const loc = HOST + '/' + slug;
    if (s.includes(loc)) continue;
    block += '  <url>\n    <loc>' + loc + '</loc>\n    <lastmod>' + TODAY_ISO + '</lastmod>\n    <priority>0.6</priority>\n  </url>\n';
    added++;
  }
  if (added) {
    s = s.replace('</urlset>', block + '</urlset>');
    fs.writeFileSync(f, s);
  }
  return added;
}

function patchLlms() {
  const f = path.join(ROOT, 'llms.txt');
  let s = fs.readFileSync(f, 'utf8');
  const line = '- [AI Model Pricing Reference](https://www.waiagent.win/model-pricing.html): Verified per-model rate cards and head-to-head workload cost comparisons for ' + MODELS.length + ' current models; every rate carries its source and check date.';
  if (s.includes('model-pricing.html')) return false;
  s = s.replace('## Model pricing and cost planning\n', '## Model pricing and cost planning\n\n' + line + '\n');
  fs.writeFileSync(f, s);
  return true;
}

/* ------------------------------------------------------------------ main */
const written = [];
for (const m of MODELS) {
  fs.writeFileSync(path.join(ROOT, 'model-' + m.id + '.html'), modelPage(m));
  written.push('model-' + m.id + '.html');
}
for (const [ia, ib] of PAIRS) {
  const slug = compareSlug(byId(ia), byId(ib));
  fs.writeFileSync(path.join(ROOT, slug), comparePage(byId(ia), byId(ib)));
  written.push(slug);
}
fs.writeFileSync(path.join(ROOT, 'model-pricing.html'), hubPage());
written.push('model-pricing.html');

const smAdded = patchSitemap(written);
const llms = patchLlms();
console.log('pages written: ' + written.length);
console.log('sitemap entries added: ' + smAdded);
console.log('llms.txt updated: ' + llms);
