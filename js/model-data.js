/* ============================================================
   AI Agent Hub — SINGLE SOURCE OF TRUTH for model data
   ============================================================
   Monthly update workflow:
     1. Edit THIS file only (prices, models, benchmarks, cards).
     2. Run:  node build/generate-index.js
        → re-renders the static tables/cards in index.html
     3. Tool pages (calculator / benchmark / token counter)
        read this file at runtime — no further action needed.

   Works in browser (window.AAH_DATA) and Node (module.exports).
   ============================================================ */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = data;
  } else {
    root.AAH_DATA = data;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Model catalog ----------
     Fields:
       id             unique slug (used by tools)
       name           display name
       company        provider / organization
       contextK       context window in K tokens (2000 = 2M)
       contextDisplay optional override, e.g. '2M+'
       inputPrice     USD per 1M input tokens   (null = no public API price)
       outputPrice    USD per 1M output tokens
       cacheReadPrice USD per 1M cached-input tokens (required for cost calculator)
       priceApprox    true → render prices with "~" prefix
       strengths      default "Strengths" column text
       tabStrengths   per-tab overrides  { china: '...' }
       tabs           which index.html tables include this model
                      ('international' | 'china' | 'opensource')
       status         default status badge { text, badge(css class) }
       tabStatus      per-tab badge overrides { international: {...} }
       openWeights    presence adds the model to the opensource table:
                      { displayName?, params, license, licenseBadge, highlights }
  */
  const models = [
    /* ===== International ===== */
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      company: 'Anthropic',
      contextK: 200,
      inputPrice: 15.0,
      outputPrice: 75.0,
      cacheReadPrice: 1.5,
      priceApprox: false,
      strengths: 'Flagship reasoning, multi-file hard coding, effort dials for cost scaling',
      tabs: ['international'],
      status: { text: 'NEW (Jul 2026)', badge: 'badge-purple' }
    },
    {
      id: 'claude-sonnet-48',
      name: 'Claude Sonnet 4.8',
      company: 'Anthropic',
      contextK: 200,
      inputPrice: 3.0,
      outputPrice: 15.0,
      cacheReadPrice: 0.3,
      priceApprox: false,
      strengths: 'Fast code completion, balanced speed/quality, cost-effective for most coding tasks',
      tabs: ['international'],
      status: { text: 'GA', badge: 'badge-purple' }
    },
    {
      id: 'gpt-56-sol',
      name: 'GPT-5.6 Sol',
      company: 'OpenAI',
      contextK: 256,
      inputPrice: 10.0,
      outputPrice: 40.0,
      cacheReadPrice: 5.0,
      priceApprox: true,
      strengths: 'Autonomous agentic speed, multi-step execution, SWE-bench lead',
      tabs: ['international'],
      status: { text: 'NEW (Jul 2026)', badge: 'badge-green' }
    },
    {
      id: 'gpt-55-mini',
      name: 'GPT-5.5 Mini',
      company: 'OpenAI',
      contextK: 256,
      inputPrice: 1.0,
      outputPrice: 4.0,
      cacheReadPrice: 0.5,
      priceApprox: true,
      strengths: 'Cost-efficient reasoning, good for most everyday tasks, fast inference',
      tabs: ['international'],
      status: { text: 'GA', badge: 'badge-green' }
    },
    {
      id: 'gemini-36-flash',
      name: 'Gemini 3.6 Flash',
      company: 'Google DeepMind',
      contextK: 2000,
      contextDisplay: '2M+',
      inputPrice: 0.075,
      outputPrice: 0.3,
      cacheReadPrice: 0.01875,
      priceApprox: true,
      strengths: 'Ultra-fast multimodal, CodeMender security agents, sub-100ms latency',
      tabs: ['international'],
      status: { text: 'NEW (Jul 2026)', badge: 'badge-blue' }
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek-V3',
      company: 'DeepSeek',
      contextK: 128,
      inputPrice: 0.27,
      outputPrice: 0.4,
      cacheReadPrice: 0.07,
      priceApprox: false,
      strengths: 'Open weights, high reasoning depth, 95% cheaper than proprietary APIs',
      tabStrengths: {
        china: 'Extreme cost-efficiency, strong coding & math, open weights, MoE architecture'
      },
      tabs: ['international', 'china', 'opensource'],
      status: { text: 'GA', badge: 'badge-green' },
      tabStatus: {
        international: { text: 'Open Weights', badge: 'badge-cyan' }
      },
      openWeights: {
        params: '671B MoE',
        license: 'MIT',
        licenseBadge: 'badge-green',
        highlights: 'Top open model, beats GPT-4 on many benchmarks, extremely cheap to run'
      }
    },
    {
      id: 'deepseek-r1',
      name: 'DeepSeek-R1',
      company: 'DeepSeek',
      contextK: 128,
      inputPrice: 0.55,
      outputPrice: 2.2,
      cacheReadPrice: 0.14,
      priceApprox: true,
      strengths: 'Chain-of-thought reasoning, open weights, strong math & code',
      tabStrengths: {
        china: 'Chain-of-thought reasoning, scientific problem-solving, transparent reasoning traces'
      },
      tabs: ['international', 'china'],
      status: { text: 'GA', badge: 'badge-green' },
      tabStatus: {
        international: { text: 'Open Weights', badge: 'badge-cyan' }
      }
    },
    {
      id: 'grok-5',
      name: 'Grok-5',
      company: 'xAI',
      contextK: 128,
      inputPrice: 5.0,
      outputPrice: 15.0,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Real-time knowledge, technical depth, math, X platform integration',
      tabs: ['international'],
      status: { text: 'GA', badge: 'badge-rose' }
    },

    /* ===== China ===== */
    {
      id: 'qwen3-235b',
      name: 'Qwen3-235B',
      company: 'Alibaba Cloud',
      contextK: 128,
      inputPrice: 0.5,
      outputPrice: 2.0,
      cacheReadPrice: 0.125,
      priceApprox: true,
      strengths: 'Multilingual (CN/EN/JP/KR), enterprise-grade, strong agent capabilities, MCP support',
      tabs: ['china', 'opensource'],
      status: { text: 'GA', badge: 'badge-green' },
      openWeights: {
        displayName: 'Qwen3',
        params: '235B',
        license: 'Apache 2.0',
        licenseBadge: 'badge-green',
        highlights: 'Best Chinese-English open model, agent-native, MCP-compatible'
      }
    },
    {
      id: 'qwen3-coder',
      name: 'Qwen3-Coder',
      company: 'Alibaba Cloud',
      contextK: 128,
      inputPrice: 0.5,
      outputPrice: 2.0,
      cacheReadPrice: 0.125,
      priceApprox: true,
      strengths: 'Specialized code generation, competitive with GPT-5.5 on coding benchmarks, multi-language support',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-green' }
    },
    {
      id: 'ernie-5',
      name: 'ERNIE 5.0',
      company: 'Baidu',
      contextK: 128,
      inputPrice: 0.8,
      outputPrice: 3.2,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Chinese language mastery, enterprise knowledge management, search integration',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-blue' }
    },
    {
      id: 'hunyuan-t1',
      name: 'Hunyuan-T1',
      company: 'Tencent',
      contextK: 256,
      inputPrice: 0.5,
      outputPrice: 1.5,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Multimodal reasoning, WeChat ecosystem integration, media understanding',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-blue' }
    },
    {
      id: 'glm-5',
      name: 'GLM-5',
      company: 'Zhipu AI',
      contextK: 128,
      inputPrice: 0.5,
      outputPrice: 1.0,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Strong agent framework, AutoGLM autonomous operations, Chinese academic excellence',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-green' }
    },
    {
      id: 'yi-lightning',
      name: 'Yi-Lightning',
      company: '01.AI (Yi)',
      contextK: 256,
      inputPrice: 0.14,
      outputPrice: 0.43,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Excellent cost-performance ratio, strong bilingual capabilities, fast inference',
      tabs: ['china', 'opensource'],
      status: { text: 'GA', badge: 'badge-green' },
      openWeights: {
        params: '—',
        license: 'Apache 2.0',
        licenseBadge: 'badge-green',
        highlights: 'Best cost-performance among open models, fast inference'
      }
    },
    {
      id: 'moonshot-v2',
      name: 'Moonshot-v2 (Kimi)',
      company: 'Moonshot AI',
      contextK: 128,
      inputPrice: 0.6,
      outputPrice: 1.8,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Ultra-long document processing, reading comprehension, document Q&A',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-blue' }
    },
    {
      id: 'step-3',
      name: 'Step-3',
      company: 'StepFun',
      contextK: 256,
      inputPrice: 0.3,
      outputPrice: 1.2,
      cacheReadPrice: null,
      priceApprox: true,
      strengths: 'Multimodal (text+image+video), strong reasoning, competitive pricing',
      tabs: ['china'],
      status: { text: 'GA', badge: 'badge-green' }
    },

    /* ===== Open source only (no public per-token API price) ===== */
    {
      id: 'llama-4',
      name: 'Llama 4',
      company: 'Meta',
      contextK: 128,
      inputPrice: null,
      outputPrice: null,
      cacheReadPrice: null,
      priceApprox: false,
      strengths: '',
      tabs: ['opensource'],
      status: { text: 'GA', badge: 'badge-green' },
      openWeights: {
        params: '400B',
        license: 'Llama 4 Community',
        licenseBadge: 'badge-green',
        highlights: 'Strong multilingual, community ecosystem, fine-tuning friendly'
      }
    },
    {
      id: 'mistral-large-3',
      name: 'Mistral Large 3',
      company: 'Mistral AI',
      contextK: 256,
      inputPrice: null,
      outputPrice: null,
      cacheReadPrice: null,
      priceApprox: false,
      strengths: '',
      tabs: ['opensource'],
      status: { text: 'Research', badge: 'badge-amber' },
      openWeights: {
        params: '123B',
        license: 'Research',
        licenseBadge: 'badge-amber',
        highlights: 'European leader, strong code & math, efficient architecture'
      }
    },

    /* ===== Calculator-only models (kept for the cost tools) ===== */
    {
      id: 'claude-haiku-48',
      name: 'Claude Haiku 4.8',
      company: 'Anthropic',
      contextK: 200,
      inputPrice: 0.8,
      outputPrice: 4.0,
      cacheReadPrice: 0.08,
      priceApprox: false,
      strengths: 'Lightning-fast for linting, formatting, simple completions',
      tabs: [],
      status: { text: 'GA', badge: 'badge-purple' }
    },
    {
      id: 'gemini-31-pro',
      name: 'Gemini 3.1 Pro',
      company: 'Google DeepMind',
      contextK: 2000,
      contextDisplay: '2M',
      inputPrice: 3.0,
      outputPrice: 9.0,
      cacheReadPrice: 0.75,
      priceApprox: false,
      strengths: 'Multimodal debugging, repo-scale analysis',
      tabs: [],
      status: { text: 'GA', badge: 'badge-blue' }
    }
  ];

  /* ---------- Agent-system benchmark matrix (tool-benchmark-compare.html) ----------
     Historical scores for agentic setups at their test date — keep verbatim,
     even when newer model versions exist in the pricing tables above.
  */
  const agentBenchmarks = [
    { name: 'Claude Code (Opus 4.8)', developer: 'Anthropic', sweBench: 72, terminalBench: 78, context: 200, inPrice: 15.0, outPrice: 75.0, open: false },
    { name: 'OpenAI Agentic Engine (GPT-5.5)', developer: 'OpenAI', sweBench: 68, terminalBench: 74, context: 256, inPrice: 10.0, outPrice: 40.0, open: false },
    { name: 'Sakana Fugu Orchestration', developer: 'Sakana AI', sweBench: 65, terminalBench: 71, context: 128, inPrice: 5.0, outPrice: 15.0, open: false },
    { name: 'Claude Sonnet 4.8', developer: 'Anthropic', sweBench: 64, terminalBench: 70, context: 200, inPrice: 3.0, outPrice: 15.0, open: false },
    { name: 'Qwen3-Coder (Agentic Setup)', developer: 'Alibaba Cloud', sweBench: 61, terminalBench: 66, context: 128, inPrice: 0.5, outPrice: 2.0, open: true },
    { name: 'Gemini 3.1 Pro (Agentic Loop)', developer: 'Google DeepMind', sweBench: 60, terminalBench: 65, context: 2000, inPrice: 3.0, outPrice: 9.0, open: false },
    { name: 'Cursor Composer (Sonnet 4.8)', developer: 'Anysphere', sweBench: 58, terminalBench: 63, context: 200, inPrice: 3.0, outPrice: 15.0, open: false },
    { name: 'DeepSeek-V3 (Agentic Setup)', developer: 'DeepSeek', sweBench: 56, terminalBench: 61, context: 128, inPrice: 0.27, outPrice: 0.4, open: true },
    { name: 'DeepSeek-R1 (CoT Agent)', developer: 'DeepSeek', sweBench: 57, terminalBench: 62, context: 128, inPrice: 0.55, outPrice: 2.2, open: true },
    { name: 'GPT-5.5 Mini', developer: 'OpenAI', sweBench: 52, terminalBench: 58, context: 256, inPrice: 1.0, outPrice: 4.0, open: false },
    { name: 'Gemini 3.1 Flash', developer: 'Google DeepMind', sweBench: 50, terminalBench: 55, context: 2000, inPrice: 0.075, outPrice: 0.3, open: false },
    { name: 'Claude Haiku 4.8', developer: 'Anthropic', sweBench: 46, terminalBench: 51, context: 200, inPrice: 0.8, outPrice: 4.0, open: false }
  ];

  /* ---------- Homepage pricing cards (index.html #pricing) ---------- */
  const pricingCards = [
    {
      modelId: 'deepseek-v3',
      provider: 'via DeepSeek API / OpenRouter',
      monthly: '~$5',
      detail: 'Ultra-budget choice for heavy coding',
      features: [
        'Exceptional code generation quality',
        '~95% cheaper than GPT-5.5',
        'Open weights — self-host option',
        'Strong at Python, JS, Rust, Go',
        'Available via OpenRouter proxy'
      ],
      cta: { text: 'Full Pricing Guide →', href: 'article-llm-pricing.html', cls: 'cta-outline' }
    },
    {
      modelId: 'claude-sonnet-48',
      provider: 'Anthropic API / Claude Code',
      monthly: '~$45',
      detail: 'Best value for Claude Code users',
      featured: true,
      features: [
        'Native Claude Code integration',
        'Excellent code quality & reasoning',
        'Fast inference for real-time coding',
        'Prompt caching reduces cost 90%',
        '200K context window'
      ],
      cta: { text: 'View Recommendations ↓', href: '#recommend', cls: 'cta-primary' }
    },
    {
      modelId: 'gpt-55-mini',
      provider: 'OpenAI API / GitHub Copilot',
      monthly: '~$25',
      detail: 'Copilot-native, broad ecosystem',
      features: [
        'Deep VS Code / JetBrains integration',
        'GitHub Copilot native model',
        'Strong across all languages',
        '256K context window',
        'Azure marketplace availability'
      ],
      cta: { text: 'Compare All Models ↓', href: '#models', cls: 'cta-outline' }
    },
    {
      modelId: 'gemini-36-flash',
      provider: 'Google AI / Vertex AI',
      monthly: '~$2',
      detail: 'Cheapest frontier model available',
      features: [
        'Insane 2M token context',
        'Multimodal (code + screenshots)',
        'Free tier for light usage',
        'Google Cloud integration',
        'Great for code review at scale'
      ],
      cta: { text: 'Compare All Models ↓', href: '#models', cls: 'cta-outline' }
    }
  ];

  /* ---------- Shared helpers (used by generator AND tool pages) ---------- */
  const utils = {
    // $15.00 → "$15.00", $0.075 → "$0.075"
    fmtPrice(n) {
      if (n === null || n === undefined) return '—';
      return '$' + (n < 0.1 ? n.toFixed(3) : n.toFixed(2));
    },
    // price pair for tables: "$15 / $75" or "~$10 / ~$40"
    fmtPricePair(m) {
      const p = m.priceApprox ? '~' : '';
      return p + utils.fmtPrice(m.inputPrice) + ' / ' + p + utils.fmtPrice(m.outputPrice);
    },
    // 200 → "200K", 2000 → "2M" (contextDisplay wins)
    fmtContext(m) {
      if (m.contextDisplay) return m.contextDisplay;
      return m.contextK >= 1000 ? m.contextK / 1000 + 'M' : m.contextK + 'K';
    },
    badge(status) {
      return '<span class="badge ' + status.badge + '">' + status.text + '</span>';
    },
    forTab(tab) {
      return models.filter(m => m.tabs.indexOf(tab) !== -1);
    },
    // models usable in cost tools: need all three prices
    priced() {
      return models.filter(m =>
        m.inputPrice !== null && m.outputPrice !== null && m.cacheReadPrice !== null
      );
    },
    byId(id) {
      return models.find(m => m.id === id) || null;
    }
  };

  return {
    updated: 'July 2026',
    models: models,
    agentBenchmarks: agentBenchmarks,
    pricingCards: pricingCards,
    utils: utils
  };
});
