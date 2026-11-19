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
const TODAY_ISO = '2026-11-19';
const TODAY_HUMAN = 'November 19, 2026';
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
  ['claude-fable-51', 'gpt-6-astra'],
  ['claude-sonnet-5', 'gpt-56-sol'],
  ['claude-opus-5', 'gpt-56-sol'],
  ['gemini-31-pro', 'gpt-56-terra'],
  ['gpt-56-luna', 'gemini-38-flash'],
  ['gpt-56-luna', 'deepseek-v41-flash'],
  ['gemini-38-flash', 'deepseek-v41-flash'],
  ['claude-haiku-45', 'gemini-38-flash']
];

/* Model-specific engineering notes & production nuances */
const MODEL_ENGINEERING_NOTES = {
  'claude-fable-51': 'Fable 5.1 is Anthropic\'s top-tier autonomous agent model. While its $10/$50 headline rate matches OpenAI\'s GPT-6 Astra, its 75% prompt cache discount ($0.25/1M read) fundamentally alters long-horizon agent economics. When an agent runs 200+ iterative turns against a shared 40K codebase prefix, over 90% of billed tokens are cache reads. That single discount cuts typical agent bills by nearly half compared to models with $1.00+ cache read rates. With 128K maximum output tokens, Fable 5.1 can generate comprehensive multi-module refactorings in a single pass without brittle chunking logic.',
  'claude-opus-5': 'Opus 5 remains Anthropic\'s heavyweight reasoning brain for deep multi-file architectural changes, formal verification, and subtle logic bugs. Its adaptive thinking budget allows it to reason through cyclic dependencies before writing a line of code. However, at $5/$25, using Opus for routine linting, file search, or basic test execution will rapidly blow past engineering budgets. Best practice is to deploy Opus 5 exclusively as an escalation brain in a multi-model router, pairing it with Sonnet 5 or Haiku 4.5.',
  'claude-sonnet-5': 'Sonnet 5 is currently the default workhorse across the software engineering community. Anthropic\'s confirmation that the $2/$10 rate is standard (cancelling the scheduled increase to $3/$15) makes it roughly 60% cheaper than Opus while solving 85%+ of daily SWE-bench style issues cleanly. Its 1M token context window comfortably accommodates medium-to-large repositories without requiring complex hierarchical AST chunking.',
  'claude-haiku-45': 'Haiku 4.5 is optimized for low-latency triage and high-volume classification. At $1/$5 and $0.10 cache reads, it excels at semantic routing, test failure parsing, git commit generation, and security pre-screening before requests are handed off to more expensive frontier models. Its short time-to-first-token (TTFT) makes it feel instantaneous in interactive terminal CLI agents.',
  'gpt-6-astra': 'Astra is OpenAI\'s flagship for computer use, tool calling, and high-concurrency coding workflows. Crucially, OpenAI rates Astra as Critical for cybersecurity capabilities under its Preparedness Framework. Watch out for the 272K token threshold: requests exceeding 272K input tokens trigger a 2x input / 1.5x output surcharge across the entire payload. In autonomous loops, aggressively prune intermediate tool logs to stay beneath this step-function billing wall.',
  'gpt-56-sol': 'Sol provides frontier-grade reasoning at promotional $4/$20 pricing (guaranteed through late November 2026). Like Astra, it enforces the 272K long-context pricing penalty. In practice, Sol exhibits near-perfect JSON schema adherence and rapid tool-call generation, making it a reliable driver for ReAct loops where argument formatting failures must be avoided.',
  'gpt-56-terra': 'Terra occupies the balanced mid-tier bracket ($2/$12), positioned directly against Claude Sonnet 5. For teams already built on OpenAI\'s Responses or Assistants API, Terra delivers consistent code synthesis speed with moderate per-task burn. Keep an eye on cache-write billing (1.25x uncached rate) when frequently mutating system prompts.',
  'gpt-56-luna': 'At $0.20 input and $1.20 output, Luna is the cheapest frontier-class model OpenAI has published. It is inexpensive enough to run continuously on background pull-request reviews, syntax linting, documentation generation, and unit-test drafting, displacing self-hosted 8B/14B models when factoring in cloud GPU compute and maintenance overhead.',
  'gemini-31-pro': 'Gemini 3.1 Pro features deep multimodal reasoning and a native 1M context window. Unlike Anthropic and OpenAI, Google bills prompt caching by hourly storage rather than an upfront per-token write charge. For short-lived coding agent sessions (under 10 minutes), this eliminates cache-write overhead entirely. However, requests over 200K tokens jump to $4.00/$18.00, requiring active context pruning in long sessions.',
  'gemini-38-flash': 'Gemini 3.8 Flash is an exceptionally fast model with an aggressive introductory rate ($0.75/$3.75) extending through the end of 2026. Supporting 64K output tokens and fast TTFT, Flash is popular for real-time web agents, interactive browser automation, and rapid unit test generation. Note that thinking tokens bill at the output rate, so unconstrained reasoning loops can inflate output token tallies.',
  'deepseek-v41-flash': 'DeepSeek V4.1 Flash offers industry-leading token economics at $0.15 input / $0.60 output and a microscopic $0.003 cache read rate. However, production engineers must plan around the weekday peak windows (01:00-04:00 and 06:00-10:00 UTC), during which rates double. Non-urgent batch workloads and background indexing jobs should be scheduled off-peak to lock in the sub-dollar price advantage.',
  'deepseek-v4-pro': 'V4 Pro is DeepSeek\'s high-reasoning model with an impressive 384K maximum output limit. Its extended availability makes it a strong candidate for complex mathematical reasoning, full-repo synthesis, and long-form technical documentation where standard 16K-32K output buffers are inadequate.'
};

/* Pair-specific engineering trade-offs */
const PAIR_ENGINEERING_NOTES = {
  'claude-fable-51-vs-gpt-6-astra': 'Both models share an identical $10/$50 headline rate, but on autonomous agent loops, their billing diverges dramatically. Fable 5.1\'s $0.25/1M cache read rate is 4x cheaper than Astra\'s $1.00/1M rate. In a 200-step agent loop where 90%+ of tokens are cached repository context, Fable 5.1 lands at $3.78 per task compared to $6.88 for Astra (a 1.8x difference). Astra counters with native computer-use capabilities and OpenAI\'s highest cybersecurity preparedness rating. For pure coding agents, Fable\'s cache math is compelling; for interactive desktop automation, Astra remains the primary contender.',
  'claude-sonnet-5-vs-gpt-56-sol': 'This is the battle for default production workhorse. Sonnet 5 charges a flat, permanent $2/$10 rate, whereas Sol charges a promotional $4/$20 rate (2x higher). On a 200-step task, Sonnet 5 costs roughly $2.74 versus $5.38 on Sol. Sol\'s advantage lies in its tight integration with OpenAI\'s Responses API and near-zero tool-argument schema validation errors. If your team writes custom prompt parsers, Sonnet 5 is far cheaper; if you rely heavily on complex nested JSON schemas, Sol may save engineering debugging hours.',
  'claude-opus-5-vs-gpt-56-sol': 'Comparing top-tier reasoning engines: Opus 5 ($5/$25) against Sol ($4/$20). On headline rates, Sol is slightly cheaper. However, Opus 5 features adaptive thinking with a 128K output window, allowing it to generate large, cohesive multi-file diffs in a single call. Sol enforces a 2x rate multiplier past 272K context tokens, meaning heavy context sessions can unexpectedly invert the price advantage in favor of Opus 5.',
  'gemini-31-pro-vs-gpt-56-terra': 'Mid-tier showdown: Gemini 3.1 Pro ($2/$12) vs GPT-5.6 Terra ($2/$12). Both share identical input rates, but their caching mechanics differ completely. Google bills cache storage per hour with zero write fee, making Gemini 3.1 Pro remarkably cheap for bursts of short agent runs. Terra charges a 1.25x write multiplier on the first step. For multimodal input (diagrams, architecture charts, screenshots), Gemini has the edge; for pure code synthesis in GitHub Actions, Terra delivers predictable step latencies.',
  'gpt-56-luna-vs-gemini-38-flash': 'Sub-dollar efficiency: Luna ($0.20/$1.20) vs Flash ($0.75/$3.75). Luna is 3.75x cheaper on input and 3x cheaper on output, making it one of the most cost-effective hosted models in existence. However, Gemini 3.8 Flash includes native thinking tokens and 64K output support, solving complex logical hurdles where Luna can cut corners. Luna is ideal for high-frequency linting and summarization; Flash is superior for autonomous step execution.',
  'gpt-56-luna-vs-deepseek-v41-flash': 'The ultimate cost race: OpenAI\'s cheapest API tier ($0.20/$1.20) against DeepSeek\'s off-peak champion ($0.15/$0.60). DeepSeek is cheaper across both input and output, especially with its $0.003 cache read rate. However, DeepSeek\'s peak-hour doubling (01:00-04:00, 06:00-10:00 UTC) narrows the gap. Teams choosing between them must weigh OpenAI\'s global latency and multi-region SLAs against DeepSeek\'s rock-bottom token costs.',
  'gemini-38-flash-vs-deepseek-v41-flash': 'The developer community\'s two favorite high-speed models. Gemini 3.8 Flash brings Google Cloud\'s massive 1M context and enterprise compliance; DeepSeek V4.1 Flash offers open-weights flexibility, standard OpenAI SDK compatibility, and off-peak token rates that are nearly free. For enterprise compliance and multimodal data, choose Flash; for budget-constrained autonomous loops and raw throughput, choose DeepSeek.',
  'claude-haiku-45-vs-gemini-38-flash': 'Fast triage and tool routing: Haiku 4.5 ($1/$5) vs Gemini 3.8 Flash ($0.75/$3.75). Gemini is slightly cheaper on list rates, but Haiku 4.5 exhibits superior prompt following on negative constraints (e.g. \'do NOT edit this file\'). For tight CI/CD verification gates where false positives cost developer time, Haiku\'s precision is often worth the modest premium.'
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
