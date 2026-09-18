# -*- coding: utf-8 -*-
"""Bring every page that hard-codes a model name or price in line with
js/model-data.js (verified 2026-09-18).

Run from the repository root:  python build/refresh-model-refs.py
Every edit is an exact string swap; the script reports any it cannot find so a
silent mismatch cannot pass as success.
"""
import io, os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

EDITS = []


def edit(fn, old, new, label):
    EDITS.append((fn, old, new, label))


NOTE = ('<div class="highlight-box"><p><strong>Model currency:</strong> this guide '
        'targets DeepSeek-R1 and V3, which remain widely deployed open-weights models. '
        'DeepSeek\u2019s current generation is V4.1, also released with open weights under '
        'the MIT license. Check the current model card and repository before sizing hardware '
        'or committing to a variant.</p></div>')

# ---------------------------------------------------------------- index.html
edit('index.html',
     '<div class="news-date">Checked Aug 5, 2026</div><h4>OpenAI GPT-5.6 tiers</h4>'
     '<p>Sol, Terra, and Luna are listed separately so readers can compare published unit '
     'rates without collapsing them into one generic \u201cGPT\u201d price.',
     '<div class="news-date">Rechecked Sep 18, 2026</div><h4>OpenAI GPT-6 Astra and the corrected GPT-5.6 rates</h4>'
     '<p>Astra joined on September 3 at $10/$50. Re-reading the model pages also corrected '
     'Sol to $4/$20, Terra to $2/$12, and Luna to $0.20/$1.20 \u2014 the previous values '
     'came from the launch post, and Luna differed by five times.',
     'index: OpenAI news card')

edit('index.html',
     '<div class="news-date">Checked Aug 5, 2026</div><h4>DeepSeek V4 pricing</h4>'
     '<p>Flash and Pro are separated, including cache-hit rates and the provider\'s '
     'not-yet-effective peak/off-peak note.',
     '<div class="news-date">Rechecked Sep 18, 2026</div><h4>DeepSeek V4.1 Flash and V4 Pro</h4>'
     '<p>Rates corrected to the off-peak card: Flash is $0.15/$0.60 and Pro $0.66/$1.98, '
     'each doubling during peak hours. DeepSeek also extended V4 Pro past its planned '
     'September 14 withdrawal.',
     'index: DeepSeek news card')

edit('index.html',
     '<div class="news-date">Checked Aug 5, 2026</div><h4>Gemini 3.6 Flash</h4>'
     '<p>The model card uses the provider-published 1M context figure and does not assume '
     'an undocumented cache discount.',
     '<div class="news-date">Rechecked Sep 18, 2026</div><h4>Gemini 3.8 Flash</h4>'
     '<p>Released September 2 on the $0.75/$3.75 introductory rate through December 31. '
     'Google now publishes a cache-read rate, so the catalog no longer assumes no discount.',
     'index: Gemini news card')

# ----------------------------------------------------------- methodology.html
edit('methodology.html',
     '>Google DeepMind Gemini 3.6 Flash performance table</a>',
     '>Google DeepMind Gemini 3.8 Flash performance table</a>',
     'methodology: benchmark source label')

edit('methodology.html',
     '>Google DeepMind Gemini 3.6 Flash</a>',
     '>Google DeepMind Gemini 3.8 Flash</a>',
     'methodology: source list')

edit('methodology.html',
     '>Claude Sonnet 5 details and introductory pricing</a>',
     '>Claude Sonnet 5 model details and pricing</a>',
     'methodology: Sonnet 5 link text')

# -------------------------------------------------- debate-pacing-frontier.html
edit('debate-pacing-frontier.html',
     '<tr><td>GPT-5.6 Luna</td><td>$1.00 per 1M input tokens</td>'
     '<td>500 trillion input tokens</td></tr>',
     '<tr><td>GPT-5.6 Luna</td><td>$0.20 per 1M input tokens</td>'
     '<td>2.5 quadrillion input tokens</td></tr>',
     'debate-pacing: Luna reference rate')

edit('debate-pacing-frontier.html',
     '<tr><td>DeepSeek V4 Flash</td><td>$0.14 per 1M input tokens</td>'
     '<td>3.6 quadrillion input tokens</td></tr>',
     '<tr><td>DeepSeek V4.1 Flash</td><td>$0.15 per 1M input tokens</td>'
     '<td>3.33 quadrillion input tokens</td></tr>',
     'debate-pacing: DeepSeek reference rate')

# ----------------------------------------------- debate-training-cost-power.html
edit('debate-training-cost-power.html',
     'DeepSeek V4 Flash at $0.14 per million input tokens',
     'DeepSeek V4.1 Flash at $0.15 per million input tokens',
     'debate-training: DeepSeek rate')

# ----------------------------------------------------- category-benchmarks.html
edit('category-benchmarks.html',
     '<h4><a href="article-ai-news-july-2026.html">July 2026 AI Frontier News: '
     'Claude Opus 5 & GPT-5.6 Sol</a></h4>',
     '<h4><a href="article-ai-news-july-2026.html">How to Verify AI Release News: '
     'July 2026 Editorial Audit</a></h4>',
     'category-benchmarks: July card title')

edit('category-benchmarks.html',
     '<p>Breakthrough roundup covering Claude Opus 5, GPT-5.6 Sol, Gemini 3.6 Flash, '
     'and agent sandbox governance.</p>',
     '<p>An editorial audit of July 2026 release claims, and the evidence ladder used to '
     'check what a provider actually announced.</p>',
     'category-benchmarks: July card description')

edit('category-benchmarks.html',
     '<h4><a href="article-claude-vs-gpt.html">Claude Opus 4.8 vs GPT-5.5 vs DeepSeek</a></h4>',
     '<h4><a href="article-claude-vs-gpt.html">Claude vs GPT vs DeepSeek for Coding</a></h4>',
     'category-benchmarks: comparison card title')

edit('category-benchmarks.html',
     '<p>Benchmarking Claude Opus 4.8, GPT-5.5, and Gemini 3.1 Pro on converting mockups '
     'and Figma designs to clean CSS/HTML.</p>',
     '<p>A screenshot-to-code evaluation protocol covering visual, structural, behavioral, '
     'and responsive layers without publishing an unreproducible leaderboard.</p>',
     'category-benchmarks: multimodal card description')

edit('category-benchmarks.html',
     '<p>Filter and sort 12+ frontier LLMs by SWE-bench scores, pricing, and context size.</p>',
     '<p>Filter a deliberately small set of comparable vendor-published coding results, '
     'with the source and its caveats shown.</p>',
     'category-benchmarks: matrix card description')

# ------------------------------------------------------ tool-agent-selector.html
edit('tool-agent-selector.html',
     "capability:['claude-opus-5','gpt-56-sol','claude-sonnet-5']",
     "capability:['gpt-6-astra','claude-fable-51','claude-opus-5']",
     'selector: capability tier adds current flagships')

edit('tool-agent-selector.html',
     "if(task==='complex')ids.unshift('claude-opus-5','gpt-56-sol');",
     "if(task==='complex')ids.unshift('gpt-6-astra','claude-fable-51');",
     'selector: complex task adds current flagships')

# --------------------------------------------- DeepSeek local deployment guides
edit('article-ollama-deepseek-r1.html',
     '<p class="lead" style="font-size:1.1rem; color:#d0d0e0; margin-bottom: 2rem;">',
     NOTE + '\n    <p class="lead" style="font-size:1.1rem; color:#d0d0e0; margin-bottom: 2rem;">',
     'ollama guide: currency note')

edit('article-ollama-deepseek-r1.html',
     'DeepSeek-R1 and V3 have redefined open-weights AI reasoning performance.',
     'DeepSeek-R1 and V3 were widely adopted open-weights reasoning releases and remain '
     'common choices for local hosting.',
     'ollama guide: soften superseded claim')

edit('article-ollama-deepseek-r1.html',
     'Near-Claude Opus reasoning performance',
     'Strong local reasoning on complex tasks',
     'ollama guide: drop stale comparison')

edit('article-ollama-deepseek-r1.html',
     'Tutorial · 12 min read · Reviewed August 10, 2026',
     'Tutorial · 12 min read · Reviewed September 18, 2026',
     'ollama guide: review date')

edit('article-self-host-deepseek.html',
     'DeepSeek-R1 has set a new standard for open-weights reasoning models, matching '
     'frontier closed models in math, science, and coding tasks.',
     'DeepSeek-R1 was a widely adopted open-weights reasoning release, reported at '
     'launch to approach closed frontier models on math, science, and coding tasks. '
     'Newer DeepSeek generations have since shipped; treat the figures below as '
     'specific to R1.',
     'self-host guide: soften superseded claim')

edit('article-self-host-deepseek.html',
     'Guide · 10 min read · Reviewed August 10, 2026',
     'Guide · 10 min read · Reviewed September 18, 2026',
     'self-host guide: review date')


def main():
    ok, missed = 0, []
    for fn, old, new, label in EDITS:
        try:
            with io.open(fn, encoding='utf-8') as f:
                s = f.read()
        except IOError:
            missed.append((label, 'FILE NOT FOUND: ' + fn))
            continue
        # Idempotency guard: check the target state first. If the replacement
        # text is already present the edit landed on an earlier run; skip it
        # rather than matching on the old string and inserting a second copy.
        if new in s:
            print('  = already applied: ' + label)
            ok += 1
            continue
        if old not in s:
            missed.append((label, 'PATTERN NOT FOUND in ' + fn))
            continue
        with io.open(fn, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s.replace(old, new, 1))
        ok += 1

    print('applied %d / %d' % (ok, len(EDITS)))
    if missed:
        print('\nMISSED:')
        for label, why in missed:
            print('  -', label, '->', why)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
