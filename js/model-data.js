/* AI Agent Hub - verified shared model data.
   Update this file, then run: node build/generate-index.js

   Review cycle: every price below was checked against the provider's own
   documentation on 2026-09-18. This catalog tracks each provider's current
   shipping lineup; superseded models are removed rather than kept alongside.
   Promotional rates carry their expiry date in priceNote. Never copy a number
   here from a third-party comparison table. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.AAH_DATA = data;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const models = [
    /* ---------------------------------------------------- Anthropic */
    {
      id: 'claude-fable-51', name: 'Claude Fable 5.1', company: 'Anthropic',
      contextK: 1000, inputPrice: 10, outputPrice: 50, cacheReadPrice: 0.25,
      strengths: 'Top-end Claude model for long-horizon autonomous agents; 1M context, 128K max output, adaptive thinking always on',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: 'Cache reads at $0.25 per 1M (75% discount vs Fable 5). Batch API halves rates to $5 / $25.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'claude-opus-5', name: 'Claude Opus 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 5, outputPrice: 25, cacheReadPrice: 0.5,
      strengths: 'Complex agentic coding and enterprise work; adaptive thinking and 128K maximum output',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', verifiedAt: '2026-11-19'
    },
    {
      id: 'claude-sonnet-5', name: 'Claude Sonnet 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.2,
      strengths: 'Fast agentic coding with a 1M context window; the default choice for most production work',
      tabs: ['international'], status: { text: 'Standard rate', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: '$2/$10 is the confirmed permanent standard rate with no scheduled increase.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'claude-haiku-45', name: 'Claude Haiku 4.5', company: 'Anthropic',
      contextK: 200, inputPrice: 1, outputPrice: 5, cacheReadPrice: 0.1,
      strengths: 'Fast current Claude model for high-volume, low-latency triage and classification',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', verifiedAt: '2026-11-19'
    },

    /* ------------------------------------------------------- OpenAI */
    {
      id: 'gpt-6-astra', name: 'GPT-6 Astra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 10, outputPrice: 50, cacheReadPrice: 1,
      strengths: 'Current OpenAI flagship for computer use, coding, and multi-step professional work; 128K max output',
      tabs: ['international'], status: { text: 'Flagship tier', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6-astra',
      priceNote: 'Rated Critical for cybersecurity capability under OpenAI Preparedness Framework. Prompts over 272K input tokens bill at 2x input and 1.5x output.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'gpt-56-sol', name: 'GPT-5.6 Sol', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 4, outputPrice: 20, cacheReadPrice: 0.4,
      strengths: 'Frontier model for complex professional work, coding, research, and tool use',
      tabs: ['international'], status: { text: 'Standard rate', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
      priceNote: '$4/$20 rate extended through Q1 2027. Prompts over 272K input tokens bill at 2x input and 1.5x output. Cache writes bill at 1.25x.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'gpt-56-terra', name: 'GPT-5.6 Terra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 2, outputPrice: 12, cacheReadPrice: 0.2,
      strengths: 'Balanced GPT-5.6 tier for strong capability at a lower unit price',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
      priceNote: 'Prompts over 272K input tokens bill at 2x input and 1.5x output. Cache writes bill at 1.25x the uncached input rate.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'gpt-56-luna', name: 'GPT-5.6 Luna', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 0.2, outputPrice: 1.2, cacheReadPrice: 0.02,
      strengths: 'Lowest-cost GPT-5.6 tier; cheapest current-generation frontier rate published by OpenAI',
      tabs: ['international'], status: { text: 'Value champion', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
      priceNote: 'Prompts over 272K input tokens bill at 2x input and 1.5x output. Cache writes bill at 1.25x.',
      verifiedAt: '2026-11-19'
    },

    /* ------------------------------------------------ Google DeepMind */
    {
      id: 'gemini-31-pro', name: 'Gemini 3.1 Pro', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 2, outputPrice: 12, cacheReadPrice: 0.2,
      strengths: 'Google flagship for reasoning, agentic work, and long context; multimodal input',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-blue' },
      sourceUrl: 'https://deepmind.google/models/gemini/pro/',
      priceNote: 'Prompts above 200K input tokens bill at $4.00 input and $18.00 output per 1M. Paid tier only.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'gemini-38-flash', name: 'Gemini 3.8 Flash', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 0.75, outputPrice: 3.75, cacheReadPrice: 0.075,
      strengths: 'Fastest Flash model for long-horizon software engineering and agents; 1M context, 64K output',
      tabs: ['international'], status: { text: 'Promo to Dec 31', badge: 'badge-blue' },
      sourceUrl: 'https://deepmind.google/models/gemini/flash/',
      priceNote: 'Introductory rate $0.75 / $3.75 valid through December 31, 2026. Standard pricing applies from January 1, 2027.',
      verifiedAt: '2026-11-19'
    },

    /* ------------------------------------------------------- DeepSeek */
    {
      id: 'deepseek-v41-flash', name: 'DeepSeek V4.1 Flash', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.15, outputPrice: 0.6, cacheReadPrice: 0.003,
      strengths: 'Ultra-low-cost DeepSeek API model with thinking mode, vision, and Responses API support',
      tabs: ['international', 'china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown. Peak hours (01:00-04:00, 06:00-10:00 UTC weekdays) double rates to $0.30 / $1.20.',
      verifiedAt: '2026-11-19'
    },
    {
      id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.66, outputPrice: 1.98, cacheReadPrice: 0.022,
      strengths: 'Higher-capability DeepSeek model with deep reasoning and 384K maximum output limit',
      tabs: ['china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown; weekday peak hours double to $1.32 / $3.96 per 1M.',
      verifiedAt: '2026-11-19'
    }
  ];

  /* Comprehensive Coding & Agentic Capability Benchmarks */
  const agentBenchmarks = [
    { name: 'Claude Fable 5.1', developer: 'Anthropic', sweBench: 68.4, terminalBench: 86.2, context: 1000, inPrice: 10, outPrice: 50, tier: 'Frontier Flagship', valueIndex: 72, open: false },
    { name: 'GPT-6 Astra', developer: 'OpenAI', sweBench: 67.8, terminalBench: 87.5, context: 1050, inPrice: 10, outPrice: 50, tier: 'Frontier Flagship', valueIndex: 71, open: false },
    { name: 'Claude Opus 5', developer: 'Anthropic', sweBench: 65.5, terminalBench: 83.1, context: 1000, inPrice: 5, outPrice: 25, tier: 'Heavy Reasoning', valueIndex: 82, open: false },
    { name: 'GPT-5.6 Sol', developer: 'OpenAI', sweBench: 64.9, terminalBench: 82.8, context: 1050, inPrice: 4, outPrice: 20, tier: 'Production Workhorse', valueIndex: 86, open: false },
    { name: 'Claude Sonnet 5', developer: 'Anthropic', sweBench: 63.2, terminalBench: 80.4, context: 1000, inPrice: 2, outPrice: 10, tier: 'Production Workhorse', valueIndex: 94, open: false },
    { name: 'GPT-5.6 Luna', developer: 'OpenAI', sweBench: 62.7, terminalBench: 84.7, context: 1050, inPrice: 0.2, outPrice: 1.2, tier: 'Value Champion', valueIndex: 99, open: false },
    { name: 'DeepSeek V4 Pro', developer: 'DeepSeek', sweBench: 62.1, terminalBench: 81.3, context: 1000, inPrice: 0.66, outPrice: 1.98, tier: 'Reasoning Specialist', valueIndex: 96, open: false },
    { name: 'Gemini 3.1 Pro', developer: 'Google DeepMind', sweBench: 61.5, terminalBench: 79.2, context: 1000, inPrice: 2, outPrice: 12, tier: 'Multimodal Flagship', valueIndex: 88, open: false },
    { name: 'GPT-5.6 Terra', developer: 'OpenAI', sweBench: 60.8, terminalBench: 78.9, context: 1050, inPrice: 2, outPrice: 12, tier: 'Balanced Tier', valueIndex: 87, open: false },
    { name: 'Gemini 3.8 Flash', developer: 'Google DeepMind', sweBench: 58.7, terminalBench: 78.0, context: 1000, inPrice: 0.75, outPrice: 3.75, tier: 'High-Speed Agent', valueIndex: 93, open: false },
    { name: 'DeepSeek V4.1 Flash', developer: 'DeepSeek', sweBench: 57.3, terminalBench: 76.5, context: 1000, inPrice: 0.15, outPrice: 0.6, tier: 'Ultra-Budget Leader', valueIndex: 98, open: false },
    { name: 'Claude Haiku 4.5', developer: 'Anthropic', sweBench: 54.2, terminalBench: 72.8, context: 200, inPrice: 1, outPrice: 5, tier: 'Fast Triage', valueIndex: 85, open: false }
  ];

  const benchmarkSource = {
    label: 'Provider-published evaluations & SWE-bench Verified leaderboard',
    url: 'https://www.swebench.com/',
    checked: 'November 2026',
    caveat: 'Vendor-published and community-reproduced SWE-bench Verified & Terminal-Bench 2.1 results. Workload prompts and scaffolding vary.'
  };

  const pricingCards = [
    {
      modelId: 'gpt-56-luna', provider: 'OpenAI API', detail: 'Lowest published unit price in current frontier class',
      features: ['1.05M context window', 'Cached input: $0.02 / 1M tokens', 'Ideal for automated linting & background PR reviews', 'Official API model page linked below'],
      cta: { text: 'Official model page', href: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna', cls: 'cta-outline' }
    },
    {
      modelId: 'claude-sonnet-5', provider: 'Anthropic API', detail: '$2 / $10 confirmed standard production rate', featured: true,
      features: ['1M context window', 'Industry default for autonomous coding', '128K maximum output buffer', '63.2% SWE-bench Verified score'],
      cta: { text: 'Official pricing', href: 'https://platform.claude.com/docs/en/about-claude/pricing', cls: 'cta-primary' }
    },
    {
      modelId: 'deepseek-v41-flash', provider: 'DeepSeek API', detail: 'Sub-dollar economics with $0.003 cache read rate',
      features: ['1M context window', 'Off-peak: $0.15 in / $0.60 out', 'OpenAI SDK drop-in compatibility', '57.3% SWE-bench Verified coding rate'],
      cta: { text: 'Official API docs', href: 'https://api-docs.deepseek.com/quick_start/pricing/', cls: 'cta-outline' }
    },
    {
      modelId: 'gemini-38-flash', provider: 'Google AI / Vertex AI', detail: 'High-speed 1M context agent engine',
      features: ['1M context window with fast TTFT', 'Multimodal vision + code support', 'Introductory $0.75 / $3.75 through Dec 31', 'Hourly cache billing model'],
      cta: { text: 'Official model page', href: 'https://deepmind.google/models/gemini/flash/', cls: 'cta-outline' }
    }
  ];

  const utils = {
    fmtPrice(n) {
      if (n === null || n === undefined) return '—';
      const digits = n < 0.01 ? 4 : (n < 0.1 ? 3 : 2);
      return '$' + n.toFixed(digits);
    },
    fmtPricePair(m) {
      const prefix = m.priceApprox ? '~' : '';
      return prefix + utils.fmtPrice(m.inputPrice) + ' / ' + prefix + utils.fmtPrice(m.outputPrice);
    },
    fmtContext(m) {
      if (m.contextDisplay) return m.contextDisplay;
      return m.contextK >= 1000 ? (m.contextK / 1000) + 'M' : m.contextK + 'K';
    },
    badge(status) {
      return '<span class="badge ' + status.badge + '">' + status.text + '</span>';
    },
    forTab(tab) {
      return models.filter(m => m.tabs.includes(tab));
    },
    priced() {
      return models.filter(m => m.inputPrice !== null && m.outputPrice !== null && m.cacheReadPrice !== null);
    },
    byId(id) {
      return models.find(m => m.id === id) || null;
    }
  };

  return {
    updated: 'November 2026',
    verifiedAt: '2026-11-19',
    models,
    agentBenchmarks,
    benchmarkSource,
    pricingCards,
    utils
  };
});
