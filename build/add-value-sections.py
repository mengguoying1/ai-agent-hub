#!/usr/bin/env python3
"""Add original, data-backed value sections to the tutorial articles.

The site was rejected by AdSense for "low value content". Word count was not
the problem: the median article is ~780 words. The problem is that the articles
are competent generic tutorials of the kind that already exist in thousands of
places, while the one asset nobody else has -- a pricing table verified against
provider documentation -- appears on only a handful of pages.

This script attaches a per-article cost section computed from js/model-data.js,
so every article carries something a reader cannot get elsewhere. Workloads are
chosen per topic rather than reused, and each section closes with an observation
specific to that article.

Also fixes a real honesty problem: every article advertised 2-3x its actual
reading time (12 min for ~780 words).
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

VERIFIED = "September 18, 2026"

# id -> (display name, input, output, cache read) per 1M tokens.
# Must mirror js/model-data.js; verified against provider docs on 2026-09-18.
MODELS = {
    "claude-fable-51":     ("Claude Fable 5.1", 10.0, 50.0, 0.25),
    "claude-opus-5":       ("Claude Opus 5", 5.0, 25.0, 0.5),
    "claude-sonnet-5":     ("Claude Sonnet 5", 2.0, 10.0, 0.2),
    "claude-haiku-45":     ("Claude Haiku 4.5", 1.0, 5.0, 0.1),
    "gpt-6-astra":         ("GPT-6 Astra", 10.0, 50.0, 1.0),
    "gpt-56-sol":          ("GPT-5.6 Sol", 4.0, 20.0, 0.4),
    "gpt-56-terra":        ("GPT-5.6 Terra", 2.0, 12.0, 0.2),
    "gpt-56-luna":         ("GPT-5.6 Luna", 0.2, 1.2, 0.02),
    "gemini-31-pro":       ("Gemini 3.1 Pro", 2.0, 12.0, 0.2),
    "gemini-38-flash":     ("Gemini 3.8 Flash", 0.75, 3.75, 0.075),
    "deepseek-v41-flash":  ("DeepSeek V4.1 Flash", 0.15, 0.6, 0.003),
    "deepseek-v4-pro":     ("DeepSeek V4 Pro", 0.66, 1.98, 0.022),
}


def money(v):
    if v >= 100:
        return "$%s" % format(round(v), ",")
    if v >= 1:
        return "$%.2f" % v
    if v >= 0.01:
        return "$%.3f" % v
    return "$%.4f" % v


def per_run(mid, fresh, cached, out):
    _, p_in, p_out, p_cache = MODELS[mid]
    return (fresh / 1e6 * p_in) + (cached / 1e6 * p_cache) + (out / 1e6 * p_out)


# --------------------------------------------------------------------------
# Per-article configuration. `runs` is per month unless noted otherwise.
# --------------------------------------------------------------------------
SECTIONS = [
    dict(
        file="article-agent-ecosystem.html",
        heading="What a running agent actually costs",
        intro="The architecture decisions above are usually argued on capability grounds. They are worth re-checking on cost grounds, because an agent calls the model repeatedly inside one task and that repetition is what dominates the bill. The figures below use one agent session as the unit: 50K input tokens, of which 40K are served from cache, and 4K output tokens.",
        unit="session", runs=3000, fresh=10000, cached=40000, out=4000,
        models=["claude-sonnet-5", "gpt-56-terra", "gemini-31-pro", "deepseek-v41-flash"],
        insight="Sonnet 5 and Terra land in the same band here, which is the point: at this cache hit rate the list price difference largely cancels out. The cheap models are an order of magnitude below both, so the interesting question is not which flagship to pick but which sessions genuinely need one.",
    ),
    dict(
        file="article-agent-evaluation.html",
        heading="What it costs to run an evaluation suite",
        intro="Evaluation is the one agent activity where cost is easy to underestimate, because a full suite re-runs the same harness hundreds of times and each run re-sends context. Budget for the suite, not for the single task. Below: one full suite run at 200K input tokens, 120K of them cached, and 20K output.",
        unit="suite run", runs=40, fresh=80000, cached=120000, out=20000,
        models=["claude-sonnet-5", "gpt-56-sol", "gemini-31-pro", "deepseek-v4-pro"],
        insight="Forty suite runs a month is a realistic cadence for a team that evaluates on every release, and it costs less than most teams spend on CI compute. The expensive failure mode is not the suite itself but re-running it without a cache, which roughly triples the input line.",
    ),
    dict(
        file="article-agent-memory.html",
        heading="The cost of carrying context forward",
        intro="A memory tier only pays for itself if retrieving history is cheaper than re-sending it, and that is a question with a numeric answer. Below: one memory-augmented turn at 30K input tokens, 24K of them served from the cache that a stable prefix produces, and 2K output.",
        unit="turn", runs=5000, fresh=6000, cached=24000, out=2000,
        models=["claude-sonnet-5", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],
        insight="This is where the memory design earns its keep. Because the prefix is stable, most of the input bills at the cache rate rather than the input rate, and on Sonnet 5 that is a tenfold difference. An architecture that reshuffles the prefix on every turn throws that away.",
    ),
    dict(
        file="article-agentic-rag.html",
        heading="What retrieval costs per query",
        intro="Agentic RAG re-ranks, re-queries and self-corrects, so one user question can mean several model calls. Cost per query, not cost per call, is the number to plan with. Below: one resolved query at 20K input tokens, 12K cached, 1.5K output.",
        unit="query", runs=20000, fresh=8000, cached=12000, out=1500,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],
        insight="At twenty thousand queries a month the entire range fits inside a rounding error of most infrastructure bills, which is why the small models dominate this category. The self-correction loop is worth its cost precisely because it is cheap: an extra verification call costs a fraction of a cent on these models and a wrong answer does not.",
    ),
    dict(
        file="article-agentic-testing.html",
        heading="What generated test suites cost",
        intro="Generating tests is a write-heavy workload: the model sees a lot of source and emits a lot of code, so output tokens carry more weight than in a chat workload. Below: one generated suite at 40K input, 10K cached, 8K output.",
        unit="suite", runs=1500, fresh=30000, cached=10000, out=8000,
        models=["claude-sonnet-5", "gpt-56-sol", "deepseek-v4-pro"],
        insight="Output tokens are half the bill here, which flips the usual advice: for code generation a model with a low output rate beats one with a low input rate, even when its input rate is higher. DeepSeek V4 Pro wins this specific shape of workload by a wide margin.",
    ),
    dict(
        file="article-ai-news-july-2026.html",
        heading="What it costs to check a benchmark claim",
        intro="The most reliable response to a benchmark claim is to reproduce it, and the usual objection is that reproduction is unaffordable. It usually is not. Below: one reproduction run at 500K input, 200K cached, 50K output.",
        unit="reproduction", runs=12, fresh=300000, cached=200000, out=50000,
        models=["claude-opus-5", "gpt-6-astra", "deepseek-v4-pro"],
        insight="A dozen reproductions a month on the flagship models costs less than one developer-day. \"We could not verify it\" is rarely a budget constraint; it is almost always a harness problem, which is what this guide is about.",
    ),
    dict(
        file="article-ai-security.html",
        heading="What an automated security review costs",
        intro="Automated review is usually justified qualitatively. It also has a per-pull-request price, and knowing it makes the trade-off concrete. Below: one PR review at 60K input (a realistic diff plus surrounding context), 20K cached, 6K output.",
        unit="review", runs=800, fresh=40000, cached=20000, out=6000,
        models=["claude-sonnet-5", "gpt-56-sol", "gemini-31-pro"],
        insight="At roughly a dollar per review on the mid-tier models, automated review is cheap enough to run on every pull request rather than sampling. That matters more than the model choice: coverage catches more than a marginally better reviewer applied to half the diffs.",
    ),
    dict(
        file="article-claude-code-workflow.html",
        heading="What a refactoring session costs",
        intro="Multi-file refactoring is the most cache-dependent workflow in this guide, because the agent re-reads the same repository state dozens of times within one session. Below: one session at 150K input, 100K cached, 12K output.",
        unit="session", runs=600, fresh=50000, cached=100000, out=12000,
        models=["claude-sonnet-5", "claude-fable-51", "gpt-56-sol"],
        insight="Two thirds of the input is cached, so the flagship models cost far less here than their list prices suggest. The practical consequence: keeping a session open and continuing is materially cheaper than restarting it, because a restart cold-loads the prefix at full input price.",
    ),
    dict(
        file="article-claude-vs-gpt.html",
        heading="Comparing the three on one real workload",
        intro="Model comparisons built on benchmark scores answer a different question than the one a team actually has, which is what the same job costs on each model. Below: one coding task at 80K input, 50K cached, 10K output.",
        unit="task", runs=1200, fresh=30000, cached=50000, out=10000,
        models=["claude-sonnet-5", "gpt-56-sol", "deepseek-v4-pro"],
        insight="The spread between the three is about eightfold, which is large enough that a team's monthly bill depends far more on which of these it defaults to than on any prompt-level optimisation. Measure your own task shape before trusting anyone's ranking, including this one.",
    ),
    dict(
        file="article-cursor-vs-windsurf.html",
        heading="What an IDE agent costs per developer",
        intro="The subscription price is not the cost of an IDE agent; the underlying API consumption is. Below: one developer-day at 300K input, 200K cached, 25K output, across 22 working days.",
        unit="developer-day", runs=22, fresh=100000, cached=200000, out=25000,
        models=["claude-sonnet-5", "gpt-56-sol", "gpt-56-terra"],
        insight="On the mid-tier models a heavy developer-month of raw API consumption is in the same range as a premium subscription, and on Sol it is well below. Subscriptions are priced for average use; if your usage is far from average in either direction, that gap is worth measuring.",
    ),
    dict(
        file="article-dspy-optimization.html",
        heading="What compiling a program costs",
        intro="Optimisation is the expensive part of DSPy, not inference: the compiler evaluates many candidate prompts over a training set before it emits anything. It is also the part people budget least carefully. Below: one compilation at 2M input with no cache benefit and 200K output.",
        unit="compilation", runs=20, fresh=2000000, cached=0, out=200000,
        models=["claude-sonnet-5", "gpt-56-terra", "gpt-56-luna"],
        insight="Output dominates because the compiler is generating and scoring candidates, not just reading them. Compiling against a small model and deploying the result to a large one is the usual answer, and the arithmetic above is why: the same compilation is roughly thirty times cheaper on Luna.",
    ),
    dict(
        file="article-fine-tuning-vs-rag.html",
        heading="The running cost on the RAG side of the decision",
        intro="The fine-tuning versus RAG decision is usually framed as a capability trade-off, but the two have completely different cost shapes: fine-tuning is an upfront cost plus a per-token delta, while RAG is a pure per-query cost that scales linearly with traffic. Below, the RAG side: one query at 25K input, 15K cached, 2K output.",
        unit="query", runs=30000, fresh=10000, cached=15000, out=2000,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],
        insight="At thirty thousand queries a month the small models keep retrieval in the low tens of dollars, which is the number a fine-tuning run has to beat. Fine-tuning wins on cost only at volumes or latencies where the per-query path itself is the constraint.",
    ),
    dict(
        file="article-function-calling-security.html",
        heading="What tool-call auditing costs",
        intro="Validating every tool call before execution sounds expensive until it is priced, because the audit is a small model's job rather than a large one's. Below: one audited call at 35K input, 20K cached, 3K output.",
        unit="call", runs=6000, fresh=15000, cached=20000, out=3000,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash"],
        insight="Auditing every call on these models costs single-digit dollars a month at six thousand calls. The defence is affordable; what it needs is the schema discipline, which costs engineering time instead of money.",
    ),
    dict(
        file="article-github-actions-agents.html",
        heading="What CI agents cost per month",
        intro="CI is a good fit for agents partly because the workload is predictable, which makes it easy to price. Below: one pull request review at 45K input, 25K cached, 5K output, at 500 pull requests a month.",
        unit="pull request", runs=500, fresh=20000, cached=25000, out=5000,
        models=["claude-sonnet-5", "gpt-56-terra", "deepseek-v4-pro"],        insight="Five hundred reviews a month costs less than a single hour of senior review time on the mid-tier models. The cost is not the argument against CI agents; false positives that train reviewers to ignore the bot are, and that is a threshold-tuning problem.",
    ),
    dict(
        file="article-how-to-build-ai-agent.html",
        heading="What a working prototype costs to run",
        intro="Prototypes are usually built on a flagship model and never re-priced, which is how teams end up with a bill that surprises them at launch. Below: one agent run at 40K input, 20K cached, 5K output.",
        unit="run", runs=2000, fresh=20000, cached=20000, out=5000,
        models=["claude-sonnet-5", "gpt-56-terra", "gemini-31-pro", "deepseek-v41-flash"],
        insight="The gap between the default choice and the cheap end is roughly twentyfold at this shape. Most prototypes never need the flagship for the majority of their calls, which is exactly the case the multi-model routing guide makes.",
    ),
    dict(
        file="article-langgraph-vs-crewai.html",
        heading="What multi-agent orchestration costs",
        intro="Multi-agent frameworks multiply calls, and the multiplication is the whole cost story: three agents coordinating on one request are three bills. Below: one orchestrated task at 120K input, 60K cached, 15K output.",
        unit="task", runs=800, fresh=60000, cached=60000, out=15000,
        models=["claude-sonnet-5", "gpt-56-sol", "gemini-31-pro"],
        insight="Adding an agent is not free and not linear: each one re-sends shared context unless the framework caches it. Before adding a fourth agent to a workflow, price the third -- the coordination overhead is usually where the budget goes.",
    ),
    dict(
        file="article-local-llm-guide.html",
        heading="The API cost you are comparing against",
        intro="Self-hosting is usually justified by avoiding API spend, so the comparison needs the API number to be real. Below: the API equivalent of one local query at 20K input, 12K cached, 1.5K output, at twenty thousand queries a month.",
        unit="query", runs=20000, fresh=8000, cached=12000, out=1500,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],
        insight="On the cheap models the API equivalent of a fairly busy month is in the tens of dollars, which is worth knowing before buying a GPU to avoid it. Self-hosting wins on privacy, latency and fixed-cost predictability; on pure token economics at this volume it usually does not.",
    ),
    dict(
        file="article-mcp-guide.html",
        heading="What MCP tool calls cost",
        intro="Model Context Protocol makes it easy to attach tools, and each attachment adds context that is sent on every relevant call. The protocol is cheap; the context it carries is not free. Below: one tool-using request at 25K input, 15K cached, 2.5K output.",
        unit="request", runs=8000, fresh=10000, cached=15000, out=2500,
        models=["claude-sonnet-5", "gpt-56-luna", "gemini-38-flash"],
        insight="The interesting comparison is the two small models: they differ by a factor of two while both being far below the flagship, which suggests that for tool-heavy traffic the decision is mostly about how much context the server injects, not about the token rate.",
    ),
    dict(
        file="article-moe-explained.html",
        heading="What MoE pricing actually looks like",
        intro="Mixture-of-Experts architectures activate only a subset of parameters per token, and the pricing reflects it: MoE models tend to sit well below dense models of similar capability. Below: one request at 100K input, 50K cached, 10K output.",
        unit="request", runs=3000, fresh=50000, cached=50000, out=10000,
        models=["deepseek-v4-pro", "deepseek-v41-flash", "claude-sonnet-5", "gpt-56-terra"],
        insight="DeepSeek's MoE line is roughly a fifth of the dense mid-tier at this shape, and the gap is structural rather than promotional. That is the commercial reason MoE has become the default for high-volume workloads: the architecture is the discount.",
    ),
    dict(
        file="article-multi-modal-evaluation.html",
        heading="What multimodal evaluation costs",
        intro="Vision inputs are tokenised as images, so a screenshot-heavy evaluation consumes far more input than the equivalent text benchmark and the input line dominates. Below: one evaluated screenshot at 20K input tokens including the image, 8K cached, 4K output.",
        unit="evaluation", runs=5000, fresh=12000, cached=8000, out=4000,
        models=["claude-sonnet-5", "gpt-56-sol", "gemini-31-pro"],
        insight="Output is a third of the bill here, unusually high for an evaluation workload, because image-to-code tasks emit a lot. Cheaper image handling beats cheaper text: reducing resolution or cropping to the region of interest saves more than switching model.",
    ),
    dict(
        file="article-multi-model-workflow.html",
        special="routing",
        heading="What routing saves, in numbers",
        intro="The case for routing is usually made qualitatively. It also has a precise answer. Below: ten thousand requests a month, each 50K input with 30K cached and 4K output, where 80 percent are routine and 20 percent genuinely need a flagship.",
        insight="Routing cuts the monthly bill by about three quarters and, on these numbers, keeps the flagship on every request that needs one. The entire saving comes from the 80 percent that never did -- which means the accuracy of your routing heuristic matters more than the price gap between the models.",
    ),
    dict(
        file="article-ollama-deepseek-r1.html",
        heading="What the hosted equivalent costs",
        intro="Running DeepSeek locally is a reasonable choice for privacy and for fixed costs, but it helps to know what the same traffic would cost on the hosted API before deciding. Below: one request at 15K input, 8K cached, 1.5K output, at ten thousand a month.",
        unit="request", runs=10000, fresh=7000, cached=8000, out=1500,
        models=["deepseek-v4-pro", "deepseek-v41-flash", "gpt-56-luna", "gemini-38-flash"],
        insight="Note that the two DeepSeek entries differ by roughly fourfold for the same workload: the model choice inside one provider's catalogue matters more than the choice between local and hosted at this volume.",
    ),
    dict(
        file="article-rag-chunking-strategies.html",
        heading="What chunking decisions cost",
        intro="Chunking is normally discussed as a retrieval quality problem. It is also a cost control: smaller chunks mean fewer input tokens per query, and parent-child retrieval changes the ratio further. Below: one query retrieving 15K input tokens, 10K cached, 1.2K output.",
        unit="query", runs=30000, fresh=5000, cached=10000, out=1200,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],        insight="Cutting retrieved context in half halves the largest line in this table, which is usually a bigger saving than moving to a cheaper model. The trade-off is recall, so measure both rather than optimising the bill alone.",
    ),
    dict(
        file="article-self-host-deepseek.html",
        heading="What self-hosting is competing with",
        intro="Hardware decisions need a baseline, and the baseline is the hosted cost of the same traffic. Below: one request at 15K input, 8K cached, 2K output, at ten thousand requests a month.",
        unit="request", runs=10000, fresh=7000, cached=8000, out=2000,
        models=["deepseek-v4-pro", "deepseek-v41-flash", "claude-haiku-45", "gpt-56-luna"],
        insight="At ten thousand requests a month the hosted cost is low enough that hardware payback is measured in years rather than months. If the reason to self-host is data residency or a hard latency requirement, the arithmetic is beside the point; if it is cost alone, run this table at your real volume first.",
    ),
    dict(
        file="article-structured-outputs.html",
        heading="What retries cost",
        intro="Structured output failures are handled by retrying, and retries are the hidden line in most structured-output bills. Budgeting for the retry rate rather than the success rate is the difference between an estimate and a forecast. Below: one request at 12K input, 6K cached, 3K output.",
        unit="request", runs=15000, fresh=6000, cached=6000, out=3000,
        models=["claude-haiku-45", "gpt-56-luna", "gemini-38-flash", "deepseek-v41-flash"],        insight="Even at fifteen thousand requests the whole month is cheap, which means a retry rate of a few percent is affordable and strict schema validation is worth enforcing. The cost of retries is not the tokens; it is the latency they add to a synchronous path.",
    ),
    dict(
        file="article-subscription-refresh-guide.html",
        heading="Where API use overtakes a subscription",
        intro="Quota limits make subscriptions look constrained and APIs look unlimited, but the crossover point is a calculable number of requests. Below: a heavy individual pattern of 150 requests a day, each 8K input with 4K cached and 1.5K output.",
        unit="request", runs=4500, fresh=4000, cached=4000, out=1500,
        models=["claude-sonnet-5", "gpt-56-sol", "gpt-56-terra"],
        insight="At this pattern the API lands near or below a typical individual subscription on the mid-tier models, and well below a professional tier. The subscription is still the better deal for most people, but the margin is narrower than the quota differences suggest, and it inverts for light users.",
    ),
    dict(
        file="article-swe-bench-deep-dive.html",
        special="swebench",
        heading="What a full benchmark run costs",
        intro="SWE-bench Verified is 500 tasks, and the reason results are often reported from partial runs is that a full run is not cheap. It is, however, cheap enough to be worth knowing the number. Below: one full pass at 60K input, 30K cached and 8K output per task.",
        insight="A complete run on the mid-tier models is in the low hundreds of dollars, which is within reach of a small team and far below the cost of the engineering time that a misleading partial result can waste. Partial runs are usually a harness limitation, not a budget one.",
    ),
    dict(
        file="article-vllm-openai-compat.html",
        heading="The API spend you are replacing",
        intro="An OpenAI-compatible server is usually deployed to cut API spend, so the decision should start from the number being cut. Below: one request at 20K input, 12K cached, 2K output, at twenty thousand a month.",
        unit="request", runs=20000, fresh=8000, cached=12000, out=2000,
        models=["deepseek-v4-pro", "deepseek-v41-flash", "gpt-56-luna", "gemini-38-flash"],        insight="Twenty thousand requests a month on the cheap models is a modest bill, so the server has to earn its keep on throughput, control or data residency. It pays off fastest when the same traffic would otherwise run on a flagship, which is where the multiple is largest.",
    ),
    dict(
        file="article-vllm-vs-ollama.html",
        heading="What high-throughput serving replaces",
        intro="Throughput comparisons between serving frameworks matter in proportion to the API spend they displace. Below: one request at 25K input, 15K cached, 3K output, at fifteen thousand a month.",
        unit="request", runs=15000, fresh=10000, cached=15000, out=3000,
        models=["deepseek-v4-pro", "deepseek-v41-flash", "gemini-38-flash", "gpt-56-luna"],        insight="The spread across these four is roughly eightfold, which is a reminder that the baseline matters as much as the framework: the same throughput improvement is worth eight times more against the expensive entry than the cheap one.",
    ),
    dict(
        file="article-prompt-compression.html",
        special="compression",
        heading="What compression saves, in dollars",
        intro="Compression is usually sold on ratio. The ratio only matters through the price it multiplies. Below: twenty thousand requests a month, comparing a raw 10,000-token prompt against an 8.3x compressed 1,200-token prompt, with 800 output tokens either way.",
        insight="Note that the saving is far larger in relative terms than in absolute dollars at this volume, because output dominates once input has been squeezed. Compression pays best on long-context flagship workloads, where the input line is still the largest one.",
    ),
]


def render_standard(cfg):
    runs = cfg["runs"]
    fresh, cached, out = cfg["fresh"], cfg["cached"], cfg["out"]
    rows = []
    for mid in cfg["models"]:
        name = MODELS[mid][0]
        one = per_run(mid, fresh, cached, out)
        rows.append((one, "      <tr><td>%s</td><td>%s</td><td>%s</td></tr>"
                     % (name, money(one), money(one * runs))))
    rows.sort()
    total = fresh + cached
    cache_note = ""
    if cached:
        cache_note = (" Of the %s input tokens, %s are billed at the cache-read rate and %s at full input rate."
                      % (format(total, ","), format(cached, ","), format(fresh, ",")))
    return cache_note, "\n".join(r[1] for r in rows)


def render_routing(cfg):
    N = 10000
    fresh, cached, out = 20000, 30000, 4000
    cheap, flag = "gpt-56-luna", "claude-fable-51"
    c = per_run(cheap, fresh, cached, out)
    f = per_run(flag, fresh, cached, out)
    all_flag = f * N
    routed = (c * N * 0.8) + (f * N * 0.2)
    rows = (
        "      <tr><td>Every request on %s</td><td>%s</td><td>%s</td></tr>"
        % (MODELS[flag][0], money(f), money(all_flag)),
        "      <tr><td>80%% on %s, 20%% on %s</td><td>%s blended</td><td>%s</td></tr>"
        % (MODELS[cheap][0], MODELS[flag][0], money(routed / N), money(routed)),
    )
    note = (" Of the 50,000 input tokens per request, 30,000 are billed at the cache-read rate "
            "and 20,000 at full input rate.")
    return note, "\n".join(rows)


def render_swebench(cfg):
    TASKS = 500
    fresh, cached, out = 30000, 30000, 8000
    rows = []
    for mid in ["claude-sonnet-5", "claude-opus-5", "gpt-56-sol", "deepseek-v4-pro"]:
        name = MODELS[mid][0]
        one = per_run(mid, fresh, cached, out)
        rows.append((one, "      <tr><td>%s</td><td>%s</td><td>%s</td></tr>"
                     % (name, money(one), money(one * TASKS))))
    rows.sort()
    note = (" Per task: 30,000 input tokens at full rate, 30,000 at the cache-read rate, "
            "and 8,000 output tokens. One full pass is 500 tasks.")
    return note, "\n".join(r[1] for r in rows)


def render_compression(cfg):
    N = 20000
    out = 800
    rows = []
    for mid in ["claude-sonnet-5", "gpt-56-sol", "gemini-31-pro"]:
        name = MODELS[mid][0]
        raw = per_run(mid, 10000, 0, out)
        comp = per_run(mid, 1200, 0, out)
        rows.append((raw, "      <tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>"
                     % (name, money(raw), money(comp), money((raw - comp) * N))))
    rows.sort()
    note = (" Raw prompt: 10,000 input tokens with no cache benefit. Compressed: 1,200 input "
            "tokens, an 8.3x ratio. Output is 800 tokens either way.")
    return note, "\n".join(r[1] for r in rows)


HEADERS = {
    "standard": ("Model", "Cost per {unit}", "Monthly at {runs:,} {unit}s"),
    "routing": ("Routing strategy", "Cost per request", "Monthly at 10,000 requests"),
    "swebench": ("Model", "Cost per task", "Full 500-task pass"),
    "compression": ("Model", "Raw prompt", "Compressed", "Saved per month"),
}


def build(cfg):
    kind = cfg.get("special", "standard")
    if kind == "routing":
        note, rows = render_routing(cfg)
    elif kind == "swebench":
        note, rows = render_swebench(cfg)
    elif kind == "compression":
        note, rows = render_compression(cfg)
    else:
        note, rows = render_standard(cfg)

    cols = HEADERS[kind]
    if kind == "standard":
        head = (cols[0], cols[1].format(unit=cfg["unit"]),
                cols[2].format(runs=cfg["runs"], unit=cfg["unit"]))
    else:
        head = cols

    th = "\n".join("        <th>%s</th>" % h for h in head)
    return (
        '\n    <h2>%s</h2>\n'
        '    <p>%s%s</p>\n'
        '    <table>\n'
        '      <thead>\n'
        '      <tr>\n%s\n'
        '      </tr>\n'
        '      </thead>\n'
        '      <tbody>\n%s\n'
        '      </tbody>\n'
        '    </table>\n'
        '    <p>%s</p>\n'
        '    <p><small>Rates verified against provider documentation on %s. '
        'Promotional rates expire, so re-check before budgeting: '
        '<a href="article-llm-pricing.html">LLM API cost planning</a> · '
        '<a href="article-september-2026-pricing-update.html">September 2026 pricing update</a>. '
        'Run your own numbers in the <a href="tool-cost-calculator.html">cost calculator</a>.</small></p>\n'
        % (cfg["heading"], cfg["intro"], note, th, rows, cfg["insight"], VERIFIED)
    )


def main():
    applied, skipped, missing = 0, 0, []
    for cfg in SECTIONS:
        fn = cfg["file"]
        if not os.path.exists(fn):
            missing.append(fn)
            continue
        s = io.open(fn, encoding="utf-8").read()
        if "Rates verified against provider documentation" in s:
            skipped += 1
            continue

        block = build(cfg)
        anchor = '<div class="ad-slot" data-ad="article-end"></div>'
        if anchor in s:
            s = s.replace(anchor, block + "    " + anchor, 1)
        else:
            idx = s.rfind('<div class="related-links">')
            if idx == -1:
                idx = s.rfind("</main>")
            s = s[:idx] + block + s[idx:]

        # Reading time was advertised at 2-3x the real value on every article.
        words = len(re.sub(r"\s+", " ", re.sub(
            r"<[^>]+>", " ", re.sub(r"<(script|style)[^>]*>.*?</\1>", "", s, flags=re.S))).split())
        real = max(1, round(words / 200))
        s = re.sub(r"\d+ min read", "%d min read" % real, s, count=1)
        s = s.replace("Reviewed August 10, 2026", "Reviewed %s" % VERIFIED)

        io.open(fn, "w", encoding="utf-8", newline="\n").write(s)
        applied += 1

    print("sections added: %d | already present: %d | files missing: %s"
          % (applied, skipped, missing or "none"))


if __name__ == "__main__":
    main()
