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
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: 'Released September 1, 2026. Cache reads fell from $1.00 to $0.25 per 1M versus Fable 5, which Anthropic estimates cuts typical workload cost about 25% and agentic workload cost up to 45%. Batch API halves rates to $5 / $25.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'claude-opus-5', name: 'Claude Opus 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 5, outputPrice: 25, cacheReadPrice: 0.5,
      strengths: 'Complex agentic coding and enterprise work; adaptive thinking and 128K maximum output',
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', verifiedAt: '2026-09-18'
    },
    {
      id: 'claude-sonnet-5', name: 'Claude Sonnet 5', company: 'Anthropic',
      contextK: 1000, inputPrice: 2, outputPrice: 10, cacheReadPrice: 0.2,
      strengths: 'Fast agentic coding with a 1M context window; the default choice for most production work',
      tabs: ['international'], status: { text: 'Standard rate', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
      priceNote: 'The $2/$10 launch rate was scheduled to rise to $3/$15 on September 1, 2026. Anthropic has since stated that increase will not occur; the pricing page now lists $2/$10 as the standard rate with no expiry.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'claude-haiku-45', name: 'Claude Haiku 4.5', company: 'Anthropic',
      contextK: 200, inputPrice: 1, outputPrice: 5, cacheReadPrice: 0.1,
      strengths: 'Fast current Claude model for high-volume and latency-sensitive work',
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-purple' },
      sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing', verifiedAt: '2026-09-18'
    },

    /* ------------------------------------------------------- OpenAI */
    {
      id: 'gpt-6-astra', name: 'GPT-6 Astra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 10, outputPrice: 50, cacheReadPrice: 1,
      strengths: 'Current OpenAI flagship for computer use, coding, and multi-step professional work; 128K max output',
      tabs: ['international'], status: { text: 'New Sep 3', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6-astra',
      priceNote: 'Released September 3, 2026. First OpenAI model rated Critical for cybersecurity capability under its Preparedness Framework. Prompts over 272K input tokens bill at 2x input and 1.5x output for the whole request. Batch and Flex are half price; Fast mode is double.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'gpt-56-sol', name: 'GPT-5.6 Sol', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 4, outputPrice: 20, cacheReadPrice: 0.4,
      strengths: 'Frontier model for complex professional work, coding, research, and tool use',
      tabs: ['international'], status: { text: 'Promo to Nov 21', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
      priceNote: 'Promotional rate guaranteed at least through November 21, 2026. Prompts over 272K input tokens bill at 2x input and 1.5x output for the whole request. Cache writes bill at 1.25x the uncached input rate.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'gpt-56-terra', name: 'GPT-5.6 Terra', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 2, outputPrice: 12, cacheReadPrice: 0.2,
      strengths: 'Balanced GPT-5.6 tier for strong capability at a lower unit price',
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
      priceNote: 'Prompts over 272K input tokens bill at 2x input and 1.5x output for the whole request. Cache writes bill at 1.25x the uncached input rate.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'gpt-56-luna', name: 'GPT-5.6 Luna', company: 'OpenAI',
      contextK: 1050, contextDisplay: '1.05M', inputPrice: 0.2, outputPrice: 1.2, cacheReadPrice: 0.02,
      strengths: 'Lowest-cost GPT-5.6 tier; cheapest current-generation frontier rate published by OpenAI',
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-green' },
      sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
      priceNote: 'Prompts over 272K input tokens bill at 2x input and 1.5x output for the whole request. Cache writes bill at 1.25x the uncached input rate.',
      verifiedAt: '2026-09-18'
    },

    /* ------------------------------------------------ Google DeepMind */
    {
      id: 'gemini-31-pro', name: 'Gemini 3.1 Pro', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 2, outputPrice: 12, cacheReadPrice: 0.2,
      strengths: 'Google flagship for reasoning, agentic work, and long context; multimodal input',
      tabs: ['international'], status: { text: 'Verified Sep 18', badge: 'badge-blue' },
      sourceUrl: 'https://deepmind.google/models/gemini/pro/',
      priceNote: 'Prompts above 200K input tokens bill at $4.00 input and $18.00 output per 1M for the whole request. Paid tier only since April 1, 2026; the free tier no longer covers Pro models.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'gemini-38-flash', name: 'Gemini 3.8 Flash', company: 'Google DeepMind',
      contextK: 1000, inputPrice: 0.75, outputPrice: 3.75, cacheReadPrice: 0.075,
      strengths: 'Newest Flash model for long-horizon software engineering and autonomous agents; 1M context, 64K output',
      tabs: ['international'], status: { text: 'Promo to Dec 31', badge: 'badge-blue' },
      sourceUrl: 'https://deepmind.google/models/gemini/flash/',
      priceNote: 'Launched September 2, 2026 on the same introductory rate as Gemini 3.6 and 3.7 Flash. Standard pricing of $1.50 / $7.50 per 1M applies from January 1, 2027. Thinking tokens bill at the output rate.',
      verifiedAt: '2026-09-18'
    },

    /* ------------------------------------------------------- DeepSeek */
    {
      id: 'deepseek-v41-flash', name: 'DeepSeek V4.1 Flash', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.15, outputPrice: 0.6, cacheReadPrice: 0.003,
      strengths: 'Low-cost current DeepSeek API model with thinking mode, vision, and Responses API support',
      tabs: ['international', 'china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown. Peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays, when input doubles to $0.30 and output to $1.20 per 1M. Model name is deepseek-flash; the retired deepseek-v4-flash identifier still resolves here.',
      verifiedAt: '2026-09-18'
    },
    {
      id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', company: 'DeepSeek',
      contextK: 1000, inputPrice: 0.66, outputPrice: 1.98, cacheReadPrice: 0.022,
      strengths: 'Higher-capability DeepSeek model with thinking mode and 384K maximum output',
      tabs: ['china'], status: { text: 'Off-peak rate', badge: 'badge-cyan' },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
      priceNote: 'Off-peak rate shown; peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays, when input doubles to $1.32 and output to $3.96 per 1M. DeepSeek had planned to withdraw this model on September 14, 2026 and has since extended it.',
      verifiedAt: '2026-09-18'
    }
  ];

  /* Vendor-published results. AI Agent Hub did not run these tests. */
  const agentBenchmarks = [
    { name: 'Claude Sonnet 5', developer: 'Anthropic', sweBench: 63.2, terminalBench: 80.4, context: 1000, inPrice: 2, outPrice: 10, open: false },
    { name: 'GPT-5.6 Luna', developer: 'OpenAI', sweBench: 62.7, terminalBench: 84.7, context: 1050, inPrice: 0.2, outPrice: 1.2, open: false },
    { name: 'Gemini 3.8 Flash', developer: 'Google DeepMind', sweBench: 58.7, terminalBench: 78, context: 1000, inPrice: 0.75, outPrice: 3.75, open: false }
  ];

  const benchmarkSource = {
    label: 'Google DeepMind Gemini Flash performance table',
    url: 'https://deepmind.google/models/gemini/flash/',
    checked: '2026-09-18',
    caveat: 'Vendor-published SWE-Bench Pro and Terminal-Bench 2.1 results; AI Agent Hub did not run these tests.'
  };

  const pricingCards = [
    {
      modelId: 'gpt-56-luna', provider: 'OpenAI API', detail: 'Lowest published unit price in this verified set',
      features: ['1.05M context window', 'Cached input: $0.02 / 1M tokens', 'Prompts above 272K bill at a premium', 'Official API model page linked below'],
      cta: { text: 'Official model page', href: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna', cls: 'cta-outline' }
    },
    {
      modelId: 'claude-sonnet-5', provider: 'Anthropic API', detail: 'Scheduled September increase cancelled', featured: true,
      features: ['1M context window', 'Strong agentic coding focus', '128K maximum output', '$2 / $10 is now the standard rate'],
      cta: { text: 'Official pricing', href: 'https://platform.claude.com/docs/en/about-claude/pricing', cls: 'cta-primary' }
    },
    {
      modelId: 'gemini-38-flash', provider: 'Google AI / Vertex AI', detail: 'Introductory rate through December 31, 2026',
      features: ['1M context window', 'Multimodal input', 'Vendor-published benchmark data', 'Reverts to $1.50 / $7.50 on January 1'],
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
    updated: 'September 18, 2026',
    verifiedAt: '2026-09-18',
    models,
    agentBenchmarks,
    benchmarkSource,
    pricingCards,
    utils
  };
});
