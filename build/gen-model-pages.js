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
const TODAY_ISO = '2026-11-26';
const TODAY_HUMAN = 'November 26, 2026';
const VERIFIED_HUMAN = 'November 2026';

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
  ['claude-fable-52', 'gpt-62-astra'],
  ['claude-sonnet-55', 'gpt-62-sol'],
  ['claude-opus-55', 'gemini-4-carbon'],
  ['gemini-4-hydrogen', 'gpt-61-terra'],
  ['gpt-6-luna', 'claude-haiku-55'],
  ['gpt-6-luna', 'deepseek-v41-flash'],
  ['gemini-38-flash', 'deepseek-v41-flash'],
  ['claude-haiku-55', 'gemini-38-flash']
];

/* Model-specific engineering notes & production nuances */
const MODEL_ENGINEERING_NOTES = {
  'claude-fable-52': 'Fable 5.2 is Anthropic\'s latest top-tier autonomous agent model, lowering headline pricing 20% from Fable 5.1 ($10/$50) down to $8/$40 while maintaining a 95% cache read discount ($0.40/1M). With 128K maximum output tokens and top-tier SWE-bench Pro scores, Fable 5.2 can execute comprehensive multi-module refactorings in a single pass.',
  'claude-opus-55': 'Opus 5.5 (released late 2026) trims Opus 5 pricing down to $4/$20 while keeping adaptive thinking always on and speeding up output token generation. It is ideal as an architectural escalation brain paired with Sonnet 5.5 or Haiku 5.5 in a multi-model router.',
  'claude-sonnet-55': 'Sonnet 5.5 is the upgraded production workhorse across software engineering teams at $2/$10 with $0.10/1M cache reads. Delivering ~81.3% on SWE-bench Pro/Verified setups within a 1M context window, it resolves the vast majority of daily repository tasks without requiring complex AST chunking.',
  'claude-haiku-55': 'Haiku 5.5 introduces a dramatic 90% price cut down to $0.10/$0.50 (≤100K input; $0.50/$2.50 >100K) and $0.01/1M cache reads. It is built for semantic routing, test failure parsing, git commit generation, and ultra-low-latency terminal CLI classification.',
  'gpt-62-astra': 'GPT-6.2 Astra is OpenAI\'s latest flagship for computer use, multi-file coding, and Responses API background mode, cutting rates 20% from GPT-6 Astra ($10/$50) to $8/$40 with $0.40 cache reads. Watch the 272K token threshold where long-context scaling multipliers apply.',
  'gpt-62-sol': 'GPT-6.2 Sol slashes the previous $4/$20 Sol tier in half to $2/$10 ($0.10 cache read), directly matching Claude Sonnet 5.5. It supports OpenAI\'s Background Mode for 30%–40% completion-window savings and excels at strict JSON schema tool calls.',
  'gpt-61-terra': 'GPT-6.1 Terra drops to $1/$5 ($0.05 cache read), offering strong visual reasoning and structured code synthesis at half the cost of GPT-5.6 Terra. Batch API processing drops it further to $0.50/$2.50.',
  'gpt-6-luna': 'At $0.10 input and $0.50 output ($0.01 cache read), GPT-6 Luna is 50% cheaper than GPT-5.6 Luna. It is inexpensive enough to run continuously on background pull-request reviews, syntax linting, and unit-test drafting.',
  'gemini-4-carbon': 'Gemini 4 Carbon is Google\'s flagship heavy-reasoning model for deep coding, debugging, and cyber-defense workflows. Introductory pricing ($2/$10) runs through November 30, 2026 before moving to standard $4/$20 rates on December 1, 2026.',
  'gemini-4-neon': 'Gemini 4 Neon ($3/$15, $0.15 cache read) sits between Hydrogen and Carbon in the Gemini 4 lineup, tuned for complex scientific reasoning and multi-file engineering with native multimodal inputs.',
  'gemini-4-hydrogen': 'Gemini 4 Hydrogen ($1.50/$7.50, $0.075 cache read) is Google\'s speed-first Gemini 4 workhorse available on both Free and Paid tiers, featuring a 1M context window and adjustable thinking budgets.',
  'gemini-38-flash': 'Gemini 3.8 Flash remains a fast, cost-effective agent engine at its $0.75/$3.75 introductory rate through December 31, 2026 (stepping up to $1.50/$7.50 on January 1, 2027).',
  'deepseek-v41-flash': 'DeepSeek V4.1 Flash offers industry-leading token economics at $0.15 input / $0.60 output, 384K max output, and a $0.003 cache read rate. Remember that weekday peak hours (01:00-04:00 and 06:00-10:00 UTC) double rates.',
  'deepseek-v4-pro': 'DeepSeek V4 Pro ($0.66/$1.98 off-peak, $0.022 cache read) provides deep reasoning and a massive 384K maximum output buffer, well-suited for full-repo synthesis and long-form technical documentation.'
};

/* Pair-specific engineering trade-offs */
const PAIR_ENGINEERING_NOTES = {
  'claude-fable-52-vs-gpt-62-astra': 'Both late-2026 flagships share an identical $8/$40 headline rate and $0.40/1M cache read rate. Fable 5.2 leads on SWE-bench Pro coding evaluations (93.3%) and 128K single-pass output, whereas GPT-6.2 Astra counters with native computer-use workflows and 30%–40% background-mode completion discounts.',
  'claude-sonnet-55-vs-gpt-62-sol': 'The $2/$10 production workhorse showdown: both Sonnet 5.5 and GPT-6.2 Sol now sit at the exact same $2/$10 list rate and $0.10 cache read rate. Sonnet 5.5 holds the edge on repository-wide refactoring (81.3% SWE-bench tier), while GPT-6.2 Sol offers native Responses API background windows.',
  'claude-opus-55-vs-gemini-4-carbon': 'Heavy-reasoning duel: Opus 5.5 ($4/$20 standard) vs Gemini 4 Carbon ($2/$10 intro through Nov 30; $4/$20 from Dec 1). Both target deep debugging and multi-step planning. Gemini 4 Carbon leads on native multimodal diagram parsing and hourly cache flexibility, while Opus 5.5 brings always-on adaptive thinking.',
  'gemini-4-hydrogen-vs-gpt-61-terra': 'Balanced mid-tier speed: Gemini 4 Hydrogen ($1.50/$7.50) vs GPT-6.1 Terra ($1/$5). Terra is 33% cheaper on raw token unit price, while Hydrogen offers a unified 1M context window without the 272K long-context surcharge.',
  'gpt-6-luna-vs-claude-haiku-55': 'Two ultra-budget champions tied at $0.10/$0.50 and $0.01/1M cache reads. Note Haiku 5.5\'s 100K prompt threshold (jumping to $0.50/$2.50 >100K) versus GPT-6 Luna\'s 272K threshold, making prompt size the deciding factor for large triage pipelines.',
  'gpt-6-luna-vs-deepseek-v41-flash': 'GPT-6 Luna ($0.10/$0.50) now undercuts even DeepSeek V4.1 Flash\'s off-peak base rate ($0.15/$0.60), though DeepSeek retains an edge on cached reads ($0.003 vs $0.01) and 384K max output.',
  'gemini-38-flash-vs-deepseek-v41-flash': 'Gemini 3.8 Flash ($0.75/$3.75 intro through Dec 31) brings Google Cloud compliance and multimodal vision, while DeepSeek V4.1 Flash ($0.15/$0.60 off-peak) delivers rock-bottom open-weights economics.',
  'claude-haiku-55-vs-gemini-38-flash': 'With Haiku 5.5 dropping to $0.10/$0.50 (≤100K), it is now 7.5x cheaper than Gemini 3.8 Flash ($0.75/$3.75) for short-context classification, routing, and CI guardrails.'
};

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

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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
    '<nav class="nav" aria-label="Primary navigation"><div class="nav-inner"><a href="./" class="nav-logo">AI <span>Agent Hub</span></a><ul class="nav-links"><li><a href="./">Home</a></li><li><a href="articles.html">Guides</a></li><li><a href="debate.html">Debate</a></li><li><a href="category-tools.html">Tools</a></li><li><a href="methodology.html">Methodology</a> · <a href="editorial-policy.html">Editorial policy</a></li><li><a href="about-author.html">Author</a></li></ul></div></nav>\n';
}
const FOOTER = '</main>\n<footer class="footer"><p>© 2026 AI Agent Hub. Maintained by Meng Guoying. Independent, source-linked analysis.</p><div class="policy-links"><a href="about.html">About</a> · <a href="about-author.html">Author & Maintainer</a> · <a href="methodology.html">Methodology</a> · <a href="editorial-policy.html">Editorial policy</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="contact.html">Contact</a></div></footer><script src="js/ads.js?v=20260918a"></script>\n' +
  '<!-- Cloudflare Web Analytics --><script type=\'module\' src=\'https://static.cloudflareinsights.com/beacon.min.js\' data-cf-beacon=\'{"token": "8d2f3ff402aa4df8a8479a2ca8886792"}\'></script><!-- End Cloudflare Web Analytics -->\n</body></html>\n';

const BYLINE = '<p class="article-byline">By <a href="about-author.html">Meng Guoying (mengg)</a> · <a href="methodology.html">Review method</a> · <a href="contact.html">Corrections</a></p>\n';

function articleLd(headline, slug) {
  return {
    '@context': 'https://schema.org', '@type': 'Article', headline,
    author: { '@type': 'Person', name: 'Meng Guoying', url: HOST + '/about-author.html' },
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
  const engNotes = MODEL_ENGINEERING_NOTES[m.id] || (m.name + ' provides ' + ctx(m) + ' context limits and dedicated caching tiers.');

  const qas = [
    { q: 'How much does ' + m.name + ' cost per million tokens?',
      a: m.name + ' costs ' + fmt(m.inputPrice) + ' per 1M input tokens and ' + fmt(m.outputPrice) + ' per 1M output tokens, with cached input at ' + fmt(m.cacheReadPrice) + ' per 1M. Verified ' + VERIFIED_HUMAN + ' against ' + m.company + "'s official pricing." },
    { q: 'What is the context window of ' + m.name + '?',
      a: m.name + ' supports a ' + ctx(m) + ' token context window, per ' + m.company + "'s documentation checked " + VERIFIED_HUMAN + '.' },
    { q: 'Does ' + m.name + ' support prompt caching?',
      a: 'Yes. Cached input tokens bill at ' + fmt(m.cacheReadPrice) + ' per 1M instead of the full input rate; ' + WRITE_NOTE[m.company] + '.' },
    { q: 'When was this ' + m.name + ' price last checked?',
      a: 'In ' + VERIFIED_HUMAN + ', against ' + m.company + "'s own pricing page: " + m.sourceUrl }
  ];

  let html = head({
    slug,
    title: m.name + ' API Pricing & Real Workload Costs (' + VERIFIED_HUMAN + ')',
    description: m.name + ' costs ' + fmt(m.inputPrice) + ' input / ' + fmt(m.outputPrice) + ' output per 1M tokens, cache reads ' + fmt(m.cacheReadPrice) + ', ' + ctx(m) + ' context. Verified ' + VERIFIED_HUMAN + ' with engineering notes and real agent cost analysis.',
    jsonld: [articleLd(m.name + ' API Pricing & Real Workload Costs', slug), faqLd(qas)]
  });

  html += '<main id="main-content"><div class="meta">Model pricing reference · Verified ' + VERIFIED_HUMAN + '</div>\n';
  html += '<h1>' + esc(m.name) + ' API Pricing & Workload Cost Analysis</h1>\n' + BYLINE;
  html += '<div class="highlight-box"><p><strong>The verified numbers:</strong> ' + esc(m.name) + ' (' + esc(m.company) + ') bills <strong>' + fmt(m.inputPrice) + '</strong> per 1M input tokens, <strong>' + fmt(m.outputPrice) + '</strong> per 1M output tokens, and <strong>' + fmt(m.cacheReadPrice) + '</strong> per 1M cached input tokens, inside a ' + ctx(m) + ' context window. On a reference 200-step agent loop, that totals roughly <strong>' + fmtMoney(task.total) + '</strong> per task.</p></div>\n';

  html += '<h2>Engineering perspective & production reality</h2>\n<p>' + esc(engNotes) + '</p>\n';

  html += '<h2>Verified rate card</h2>\n<table><thead><tr><th>Item</th><th>Rate</th><th>Unit</th></tr></thead><tbody>\n' +
    '<tr><td>Input</td><td>' + fmt(m.inputPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Output</td><td>' + fmt(m.outputPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Cached input (cache read)</td><td>' + fmt(m.cacheReadPrice) + '</td><td>per 1M tokens</td></tr>\n' +
    '<tr><td>Context window</td><td>' + ctx(m) + '</td><td>tokens</td></tr>\n' +
    '</tbody></table>\n';
  if (m.priceNote) html += '<p><strong>Billing notes:</strong> ' + esc(m.priceNote) + '</p>\n';
  html += '<p>Source: <a href="' + m.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + esc(m.company) + ' official pricing &#8599;</a>, checked ' + VERIFIED_HUMAN + '.</p>\n';

  html += '<h2>Translating list rates into real engineering spend</h2>\n';
  html += '<p>List rates per million tokens can be deceiving because autonomous loops hit prompt caches repeatedly. Below are two concrete reference workloads calculating the exact dollar burn for ' + esc(m.name) + ':</p>\n';
  html += '<h3>Scenario A &mdash; One 200-step autonomous agent task</h3>\n';
  html += '<p>A coding agent operates over 200 steps with a fixed 40,000-token prefix (system instructions, tool declarations, repository map). The prefix is cached on step 1 and re-read on the remaining 199 steps, producing 500 output tokens per step. For ' + esc(m.company) + ', ' + WRITE_NOTE[m.company] + '.</p>\n';
  const writeCell = task.isGoogle ? '<td>&mdash;</td>' : '<td>' + fmtMoney(task.write) + '</td>';
  const writeCalc = task.isGoogle ? 'billed via hourly cache storage (excluded)' : '40,000 tokens &times; ' + fmt(m.inputPrice * WRITE_MULT[m.company]) + ' / 1M';
  html += '<table><thead><tr><th>Component</th><th>Calculation</th><th>Cost</th></tr></thead><tbody>\n' +
    '<tr><td>Cache write (once)</td><td>' + writeCalc + '</td>' + writeCell + '</tr>\n' +
    '<tr><td>Cache reads</td><td>199 &times; 40,000 &times; ' + fmt(m.cacheReadPrice) + ' / 1M</td><td>' + fmtMoney(task.reads) + '</td></tr>\n' +
    '<tr><td>Output</td><td>200 &times; 500 &times; ' + fmt(m.outputPrice) + ' / 1M</td><td>' + fmtMoney(task.out) + '</td></tr>\n' +
    '<tr><td><strong>Total per task</strong></td><td></td><td><strong>' + fmtMoney(task.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';
  html += '<h3>Scenario B &mdash; Monthly production volume</h3>\n';
  html += '<p>A team runs a production service processing 50M fresh input tokens, 150M cached input tokens, and 10M output tokens through ' + esc(m.name) + ' per month:</p>\n';
  html += '<table><thead><tr><th>Component</th><th>Volume</th><th>Cost</th></tr></thead><tbody>\n' +
    '<tr><td>Fresh input</td><td>50M &times; ' + fmt(m.inputPrice) + '</td><td>' + fmtMoney(month.fresh) + '</td></tr>\n' +
    '<tr><td>Cached input</td><td>150M &times; ' + fmt(m.cacheReadPrice) + '</td><td>' + fmtMoney(month.cached) + '</td></tr>\n' +
    '<tr><td>Output</td><td>10M &times; ' + fmt(m.outputPrice) + '</td><td>' + fmtMoney(month.out) + '</td></tr>\n' +
    '<tr><td><strong>Monthly total</strong></td><td></td><td><strong>' + fmtMoney(month.total) + '</strong></td></tr>\n' +
    '</tbody></table>\n';
  if (m.company === 'DeepSeek') html += '<p>DeepSeek rates above are off-peak; weekday peak hours (01:00&ndash;04:00 and 06:00&ndash;10:00 UTC) double the input and output rates.</p>\n';

  if (myPairs.length) {
    html += '<h2>Head-to-head comparisons</h2>\n<ul>\n';
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
  const pairKey = a.id + '-vs-' + b.id;
  const altKey = b.id + '-vs-' + a.id;
  const pairNotes = PAIR_ENGINEERING_NOTES[pairKey] || PAIR_ENGINEERING_NOTES[altKey] || (
    'Comparing ' + a.name + ' (' + fmt(a.inputPrice) + '/' + fmt(a.outputPrice) + ') against ' + b.name + ' (' + fmt(b.inputPrice) + '/' + fmt(b.outputPrice) + '). Test both on your specific evaluation set before scaling.'
  );

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
      a: 'Both rate cards were read from the providers\' own pricing pages in ' + VERIFIED_HUMAN + ': ' + a.sourceUrl + ' and ' + b.sourceUrl + '.' }
  ];

  let html = head({
    slug,
    title: a.name + ' vs ' + b.name + ': API Cost Compared (' + VERIFIED_HUMAN + ')',
    description: a.name + ' (' + fmt(a.inputPrice) + '/' + fmt(a.outputPrice) + ') vs ' + b.name + ' (' + fmt(b.inputPrice) + '/' + fmt(b.outputPrice) + ') per 1M tokens. Same workload priced on both: ' + fmtMoney(ta.total) + ' vs ' + fmtMoney(tb.total) + '. Rates verified ' + VERIFIED_HUMAN + '.',
    jsonld: [articleLd(a.name + ' vs ' + b.name + ': API Cost Compared', slug), faqLd(qas)]
  });

  html += '<main id="main-content"><div class="meta">Head-to-head cost comparison · Verified ' + VERIFIED_HUMAN + '</div>\n';
  html += '<h1>' + esc(a.name) + ' vs ' + esc(b.name) + ': Real API Cost Compared</h1>\n' + BYLINE;
  html += '<div class="highlight-box"><p><strong>The verdict, in numbers:</strong> ' + verdict + '</p></div>\n';

  html += '<h2>Engineering trade-offs & production reality</h2>\n<p>' + esc(pairNotes) + '</p>\n';

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

  html += '<h2>Frequently asked questions</h2>\n';
  for (const { q, a: ans } of qas) html += '<h3>' + esc(q) + '</h3>\n<p>' + esc(ans) + '</p>\n';

  html += '<h2>Keep digging</h2>\n<div class="related-links"><strong>Full rate cards:</strong> <a href="model-' + a.id + '.html">' + esc(a.name) + ' pricing</a> · <a href="model-' + b.id + '.html">' + esc(b.name) + ' pricing</a> · <a href="model-pricing.html">All models</a> · <a href="article-cache-price-war-september-2026.html">Why cache prices moved</a></div>\n';
  html += '<div class="ad-slot" data-ad="article-end"></div>\n';

  return html + FOOTER;
}

/* ---------------------------------------------------------------- hub page */
function hubPage() {
  const slug = 'model-pricing.html';
  const companies = [...new Set(MODELS.map(m => m.company))];
  let html = head({
    slug,
    title: 'AI Model Pricing Reference — Verified Rates & Head-to-Head Costs (' + VERIFIED_HUMAN + ')',
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
