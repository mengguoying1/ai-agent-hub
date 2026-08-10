/* AI Agent Hub - verified shared model data.
   Update this file, then run: node build/generate-index.js */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.AAH_DATA = data;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const models = [
    {
      id: 'claude-opus-5', name: 'Claude Opus 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 5, outputPrice: 25, cacheReadPrice: 0.5,
      strengths: 'Complex agentic coding and enterprise work; adaptive thinking and 128K maximum output',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview', verifiedAt: '2026-08-05'
    },
    {
      id: 'claude-sonnet-5', name: 'Claude Sonnet 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.2,
      strengths: 'Fast agentic coding with a 1M context window; introductory price through Aug 31, 2026',
      tabs: ['international'], status: { text: 'Intro price', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5',
      priceNote: 'Standard price becomes $3 input / $15 output after August 31, 2026.', verifiedAt: '2026-08-05'
    },
    {
      id: 'gpt-56-sol', name: 'GPT-5.6 Sol', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 5, outputPrice: 30, cacheReadPrice: 0.5,
      strengths: 'Frontier model for complex professional work, coding, research, and tool use',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol', verifiedAt: '2026-08-05'
    },
    {
      id: 'gpt-56-terra', name: 'GPT-5.6 Terra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 2.5, outputPrice: 15, cacheReadPrice: 0.25,
      strengths: 'Balanced GPT-5.6 tier for strong capability at a lower unit price',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra', verifiedAt: '2026-08-05'
    },
    {
      id: 'gpt-56-luna', name: 'GPT-5.6 Luna', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 1, outputPrice: 6, cacheReadPrice: 0.1,
      strengths: 'Cost-sensitive, high-volume GPT-5.6 tier with the same published context limit',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna', verifiedAt: '2026-08-05'
    },
    {
      id: 'gemini-36-flash', name: 'Gemini 3.6 Flash', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 1.5, outputPrice: 7.5, cacheReadPrice: 1.5,
      strengths: 'Multimodal model for coding, knowledge work, and long-context understanding',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-blue' },
      sourceUrl: 'https://deepmind.google/models/gemini/flash/',
      cacheNote: 'No cache discount is assumed in the calculator.', verifiedAt: '2026-08-05'
    },
    {
      id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.14, outputPrice: 0.28, cacheReadPrice: 0.0028,
      strengths: 'Low-cost current DeepSeek API model with thinking mode and Responses API support',
      tabs: ['international', 'china'], status: { text: 'Verified Aug 5', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Peak/off-peak pricing was announced without an effective date when checked.', verifiedAt: '2026-08-05'
    },
    {
      id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.435, outputPrice: 0.87, cacheReadPrice: 0.003625,
      strengths: 'Higher-capability DeepSeek V4 API model with thinking mode and 384K maximum output',
      tabs: ['china'], status: { text: 'Verified Aug 5', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Peak/off-peak pricing was announced without an effective date when checked.', verifiedAt: '2026-08-05'
    },
    {
      id: 'claude-haiku-45', name: 'Claude Haiku 4.5', company: 'Anthropic',
      contextK: 200, inputPrice: 1, outputPrice: 5, cacheReadPrice: 0.1,
      strengths: 'Fast current Claude model for high-volume and latency-sensitive work',
      tabs: ['international'], status: { text: 'Verified Aug 5', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview', verifiedAt: '2026-08-05'
    }
  ];

  const agentBenchmarks = [
    { name: 'Claude Sonnet 5', developer: 'Anthropic', sweBench: 63.2, terminalBench: 80.4, context: 1000, inPrice: 2, outPrice: 10, open: false },
    { name: 'GPT-5.6 Luna', developer: 'OpenAI', sweBench: 62.7, terminalBench: 84.7, context: 1050, inPrice: 1, outPrice: 6, open: false },
    { name: 'Gemini 3.6 Flash', developer: 'Google DeepMind', sweBench: 58.7, terminalBench: 78, context: 1000, inPrice: 1.5, outPrice: 7.5, open: false }
  ];

  const benchmarkSource = {
    label: 'Google DeepMind Gemini 3.6 Flash performance table',
    url: 'https://deepmind.google/models/gemini/flash/',
    checked: '2026-08-05',
    caveat: 'Vendor-published SWE-Bench Pro and Terminal-Bench 2.1 results; AI Agent Hub did not run these tests.'
  };

  const pricingCards = [
    {
      modelId: 'deepseek-v4-flash', provider: 'DeepSeek API', detail: 'Lowest published unit price in this verified set',
      features: ['1M context window', 'Cache-hit input: $0.0028 / 1M tokens', 'Thinking mode available', 'Official API pricing linked below'],
      cta: { text: 'Official pricing', href: 'https://api-docs.deepseek.com/quick_start/pricing/', cls: 'cta-outline' }
    },
    {
      modelId: 'claude-sonnet-5', provider: 'Anthropic API', detail: 'Introductory pricing through August 31, 2026', featured: true,
      features: ['1M context window', 'Strong agentic coding focus', '128K maximum output', 'Price rises to $3 / $15 after August 31'],
      cta: { text: 'Official model page', href: 'https://platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5', cls: 'cta-primary' }
    },
    {
      modelId: 'gpt-56-luna', provider: 'OpenAI API', detail: 'Lower-cost GPT-5.6 tier for volume workloads',
      features: ['1.05M context window', '$0.10 cached input / 1M tokens', 'Tool use and coding support', 'Official API model page linked below'],
      cta: { text: 'Official model page', href: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna', cls: 'cta-outline' }
    },
    {
      modelId: 'gemini-36-flash', provider: 'Google AI / Vertex AI', detail: 'Multimodal, long-context option',
      features: ['1M context window', 'Multimodal input', 'Vendor-published benchmark data', 'Calculator assumes no cache discount'],
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
    updated: 'August 5, 2026',
    verifiedAt: '2026-08-05',
    models,
    agentBenchmarks,
    benchmarkSource,
    pricingCards,
    utils
  };
});