/* AI Agent Hub - verified shared model data.
   Update this file, then run: node build/generate-index.js

   Review cycle: every price below was checked against the provider's own
   documentation on 2026-11-26. This catalog tracks each provider's current
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
      id: 'claude-fable-52', name: 'Claude Fable 5.2', company: 'Anthropic',
      contextK: 1000, inputPrice: 8, outputPrice: 40, cacheReadPrice: 0.4,
      strengths: 'Latest Anthropic flagship for multi-step reasoning, agentic orchestration, and 128K output; 20% cheaper than Fable 5.1',
      tabs: ['international'], status: { text: 'New Nov 2026', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: 'Cache reads at $0.40 per 1M (95% discount). Batch API halves rates to $4 / $20.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'claude-opus-55', name: 'Claude Opus 5.5', company: 'Anthropic',
      contextK: 1000, inputPrice: 4, outputPrice: 20, cacheReadPrice: 0.2,
      strengths: 'Long-running agentic coding and computer-use workflows; adaptive thinking always on, faster and 20% cheaper than Opus 5',
      tabs: ['international'], status: { text: 'New Nov 2026', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: 'Cache reads at $0.20 per 1M. Batch API halves rates to $2 / $10.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'claude-sonnet-55', name: 'Claude Sonnet 5.5', company: 'Anthropic',
      contextK: 1000, inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.1,
      strengths: 'Upgraded default production workhorse balancing speed, 1M context, and coding intelligence',
      tabs: ['international'], status: { text: 'Standard rate', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: '$2/$10 confirmed standard rate. Prompt caching cuts repeated input by up to 95%.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'claude-haiku-55', name: 'Claude Haiku 5.5', company: 'Anthropic',
      contextK: 1000, inputPrice: 0.1, outputPrice: 0.5, cacheReadPrice: 0.01,
      strengths: 'Ultra-fast, high-volume triage, routing, and real-time classification; 90% price drop vs Haiku 4.5',
      tabs: ['international'], status: { text: 'Value leader', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: '$0.10 / $0.50 for prompts ≤ 100K tokens; prompts > 100K bill at $0.50 / $2.50 per 1M.',
      verifiedAt: '2026-11-26'
    },

    /* ------------------------------------------------------- OpenAI */
    {
      id: 'gpt-62-astra', name: 'GPT-6.2 Astra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 8, outputPrice: 40, cacheReadPrice: 0.4,
      strengths: 'Latest OpenAI flagship for computer use, multi-file coding, and Responses API background mode; 20% cheaper than GPT-6 Astra',
      tabs: ['international'], status: { text: 'Flagship tier', badge: 'badge-green' },
      sourceUrl: 'https://openai.com/api/pricing/',
      priceNote: 'Prompts over 272K input tokens trigger long-context scaling. Batch API cuts rates 50% to $4 / $20.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gpt-62-sol', name: 'GPT-6.2 Sol', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.1,
      strengths: 'Cost-efficient mid-tier frontier model for coding, tool calling, and agentic workflows (halved from GPT-5.6 Sol $4/$20)',
      tabs: ['international'], status: { text: 'New Nov 2026', badge: 'badge-green' },
      sourceUrl: 'https://openai.com/api/pricing/',
      priceNote: 'Cache reads at $0.10 per 1M. Background mode offers 30%-40% completion-window discounts.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gpt-61-terra', name: 'GPT-6.1 Terra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 1, outputPrice: 5, cacheReadPrice: 0.05,
      strengths: 'Balanced GPT-6.1 tier for visual reasoning and structured workflows at half the price of GPT-5.6 Terra',
      tabs: ['international'], status: { text: 'Verified Nov 2026', badge: 'badge-green' },
      sourceUrl: 'https://openai.com/api/pricing/',
      priceNote: 'Prompts over 272K input tokens incur long-context multiplier. Batch API bills $0.50 / $2.50.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gpt-6-luna', name: 'GPT-6 Luna', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 0.1, outputPrice: 0.5, cacheReadPrice: 0.01,
      strengths: 'Lowest-cost GPT-6 tier for high-volume linting, classification, and background PR automation (50% cheaper than 5.6 Luna)',
      tabs: ['international'], status: { text: 'Value champion', badge: 'badge-green' },
      sourceUrl: 'https://openai.com/api/pricing/',
      priceNote: 'Cache reads at $0.01 per 1M. Batch API cuts rates to $0.05 / $0.25.',
      verifiedAt: '2026-11-26'
    },

    /* ------------------------------------------------ Google DeepMind */
    {
      id: 'gemini-4-carbon', name: 'Gemini 4 Carbon', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.1,
      strengths: 'Google Gemini 4 flagship heavy-reasoning model for deep coding, debugging, and open-ended research',
      tabs: ['international'], status: { text: 'Intro to Nov 30', badge: 'badge-blue' },
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      priceNote: 'Introductory $2.00 / $10.00 valid through November 30, 2026; standard rate $4.00 / $20.00 takes effect December 1, 2026.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gemini-4-neon', name: 'Gemini 4 Neon', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 3, outputPrice: 15, cacheReadPrice: 0.15,
      strengths: 'Mid-tier Gemini 4 reasoning model bridging Hydrogen and Carbon for fast software engineering and scientific workflows',
      tabs: ['international'], status: { text: 'New Nov 2026', badge: 'badge-blue' },
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      priceNote: 'Paid tier on Google AI Studio and Vertex AI. Context caching cuts input reads to $0.15 / 1M.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 1.5, outputPrice: 7.5, cacheReadPrice: 0.075,
      strengths: 'Speed-first Gemini 4 workhorse for high-throughput agentic execution, multimodal input, and adjustable thinking',
      tabs: ['international'], status: { text: 'New Nov 2026', badge: 'badge-blue' },
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      priceNote: 'Available on both Free and Paid Gemini API tiers with uniform 1M context window.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'gemini-38-flash', name: 'Gemini 3.8 Flash', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 0.75, outputPrice: 3.75, cacheReadPrice: 0.075,
      strengths: 'Fast Flash workhorse for long-horizon software engineering and agents; 1M context, 64K output',
      tabs: ['international'], status: { text: 'Promo to Dec 31', badge: 'badge-blue' },
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      priceNote: 'Introductory rate $0.75 / $3.75 valid through December 31, 2026; standard $1.50 / $7.50 applies from January 1, 2027.',
      verifiedAt: '2026-11-26'
    },

    /* ------------------------------------------------------- DeepSeek */
    {
      id: 'deepseek-v41-flash', name: 'DeepSeek V4.1 Flash', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.15, outputPrice: 0.6, cacheReadPrice: 0.003,
      strengths: 'Ultra-low-cost DeepSeek API model with thinking mode, 384K output, vision, and Responses API support',
      tabs: ['china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown. Peak hours (01:00-04:00, 06:00-10:00 UTC weekdays) double rates to $0.30 / $1.20.',
      verifiedAt: '2026-11-26'
    },
    {
      id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.66, outputPrice: 1.98, cacheReadPrice: 0.022,
      strengths: 'Higher-capability DeepSeek model with deep reasoning and 384K maximum output limit',
      tabs: ['china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown; weekday peak hours double to $1.32 / $3.96 per 1M.',
      verifiedAt: '2026-11-26'
    }
  ];

  /* Comprehensive Coding & Agentic Capability Benchmarks */
  const agentBenchmarks = [
    { name: 'Claude Fable 5.2', developer: 'Anthropic', sweBench: 93.3, terminalBench: 89.4, context: 1000, inPrice: 8, outPrice: 40, tier: 'Frontier Flagship', valueIndex: 81, open: false },
    { name: 'Claude Sonnet 5.5', developer: 'Anthropic', sweBench: 81.3, terminalBench: 84.2, context: 1000, inPrice: 2, outPrice: 10, tier: 'Production Workhorse', valueIndex: 95, open: false },
    { name: 'Claude Opus 5.5', developer: 'Anthropic', sweBench: 79.5, terminalBench: 86.4, context: 1000, inPrice: 4, outPrice: 20, tier: 'Heavy Reasoning', valueIndex: 88, open: false },
    { name: 'GPT-6.2 Astra', developer: 'OpenAI', sweBench: 77.0, terminalBench: 89.8, context: 1050, inPrice: 8, outPrice: 40, tier: 'Frontier Flagship', valueIndex: 76, open: false },
    { name: 'GPT-6.2 Sol', developer: 'OpenAI', sweBench: 74.2, terminalBench: 85.1, context: 1050, inPrice: 2, outPrice: 10, tier: 'Production Workhorse', valueIndex: 92, open: false },
    { name: 'Gemini 4 Carbon', developer: 'Google DeepMind', sweBench: 68.0, terminalBench: 84.5, context: 1000, inPrice: 2, outPrice: 10, tier: 'Heavy Reasoning', valueIndex: 90, open: false },
    { name: 'GPT-6.1 Terra', developer: 'OpenAI', sweBench: 66.5, terminalBench: 80.2, context: 1050, inPrice: 1, outPrice: 5, tier: 'Balanced Tier', valueIndex: 94, open: false },
    { name: 'Gemini 4 Neon', developer: 'Google DeepMind', sweBench: 65.4, terminalBench: 81.8, context: 1000, inPrice: 3, outPrice: 15, tier: 'Multimodal Reasoning', valueIndex: 85, open: false },
    { name: 'GPT-6 Luna', developer: 'OpenAI', sweBench: 64.1, terminalBench: 85.2, context: 1050, inPrice: 0.1, outPrice: 0.5, tier: 'Value Champion', valueIndex: 99, open: false },
    { name: 'Gemini 4 Hydrogen', developer: 'Google DeepMind', sweBench: 62.8, terminalBench: 79.6, context: 1000, inPrice: 1.5, outPrice: 7.5, tier: 'High-Speed Agent', valueIndex: 89, open: false },
    { name: 'DeepSeek V4 Pro', developer: 'DeepSeek', sweBench: 62.1, terminalBench: 81.3, context: 1000, inPrice: 0.66, outPrice: 1.98, tier: 'Reasoning Specialist', valueIndex: 96, open: false },
    { name: 'Gemini 3.8 Flash', developer: 'Google DeepMind', sweBench: 58.7, terminalBench: 78.0, context: 1000, inPrice: 0.75, outPrice: 3.75, tier: 'High-Speed Agent', valueIndex: 93, open: false },
    { name: 'Claude Haiku 5.5', developer: 'Anthropic', sweBench: 58.1, terminalBench: 75.4, context: 1000, inPrice: 0.1, outPrice: 0.5, tier: 'Fast Triage', valueIndex: 97, open: false },
    { name: 'DeepSeek V4.1 Flash', developer: 'DeepSeek', sweBench: 57.3, terminalBench: 76.5, context: 1000, inPrice: 0.15, outPrice: 0.6, tier: 'Ultra-Budget Leader', valueIndex: 98, open: false }
  ];

  const benchmarkSource = {
    label: 'Provider-published evaluations & SWE-bench Pro / Terminal-Bench 2.1',
    url: 'https://www.swebench.com/',
    checked: 'November 26, 2026',
    caveat: 'Vendor-published and community-reproduced SWE-bench Pro/Verified & Terminal-Bench results. Workload prompts and scaffolding vary.'
  };

  const pricingCards = [
    {
      modelId: 'gpt-6-luna', provider: 'OpenAI API', detail: 'Lowest published unit price in GPT-6 class',
      features: ['1.05M context window', 'Cached input: $0.01 / 1M tokens', '50% cheaper than GPT-5.6 Luna', 'Batch API: $0.05 in / $0.25 out'],
      cta: { text: 'Official pricing', href: 'https://openai.com/api/pricing/', cls: 'cta-outline' }
    },
    {
      modelId: 'claude-sonnet-55', provider: 'Anthropic API', detail: '$2 / $10 standard production workhorse', featured: true,
      features: ['1M context window', '81.3% SWE-bench Pro/Verified tier', '95% prompt caching discount ($0.10/1M)', 'Industry default for autonomous coding'],
      cta: { text: 'Official pricing', href: 'https://platform.claude.com/docs/en/about-claude/pricing', cls: 'cta-primary' }
    },
    {
      modelId: 'claude-haiku-55', provider: 'Anthropic API', detail: '90% price drop to $0.10 / $0.50 (≤100K)',
      features: ['1M context window', 'Cached input: $0.01 / 1M tokens', 'Ideal for semantic routing & triage', 'Batch API: $0.05 in / $0.25 out'],
      cta: { text: 'Official pricing', href: 'https://platform.claude.com/docs/en/about-claude/pricing', cls: 'cta-outline' }
    },
    {
      modelId: 'deepseek-v41-flash', provider: 'DeepSeek API', detail: 'Sub-dollar economics with $0.003 cache read',
      features: ['1M context & 384K max output', 'Off-peak: $0.15 in / $0.60 out', 'OpenAI SDK drop-in compatibility', '57.3% coding benchmark rate'],
      cta: { text: 'Official API docs', href: 'https://api-docs.deepseek.com/quick_start/pricing/', cls: 'cta-outline' }
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
    updated: 'November 26, 2026',
    verifiedAt: '2026-11-26',
    models,
    agentBenchmarks,
    benchmarkSource,
    pricingCards,
    utils
  };
});
