# Kubb v4 vs v5 benchmark

A self-contained harness that measures **code-generation speed** and **memory usage** of Kubb v4
against the v5 beta, over three real OpenAPI specs and three plugin combinations. It backs the
"Performance" section of the v5 migration guide with real, reproducible measurements instead of an
unsourced table.

Every number in `results/results.json` comes from actually running both major versions on this
machine. Nothing is estimated.

## Layout

```
v4-vs-v5/
├── run.mjs             # orchestrator: spawns child processes, aggregates, writes results/results.json
├── results/
│   └── results.json    # output (regenerated on each run)
├── v4/                  # isolated npm tree for Kubb v4 (own node_modules)
│   ├── package.json
│   └── run-one.mjs     # runs one generation with v4 packages
├── v5/                  # isolated npm tree for Kubb v5 beta (own node_modules)
│   ├── package.json
│   └── run-one.mjs     # runs one generation with v5 packages
└── fixtures/            # gitignored; downloaded/copied at runtime
    ├── petStore.yaml   # 21 operations   (copied from packages/adapter-oas/mocks)
    ├── twitter.json    # 80 operations   (copied from kubb-labs/plugins schemas)
    └── openai.yaml     # ~280 operations (fetched from openai/openai-openapi, grows over time)
```

v4 and v5 share package names (`@kubb/core`, `@kubb/plugin-ts`, …) at different major versions, so
they live in **separate npm trees** with their own `node_modules`. Installs use plain `npm`, not
`pnpm`, to keep the two trees from being hoisted/deduped together. This folder is intentionally not a
pnpm workspace member.

## Prerequisites

- Node 22+
- Network access to `registry.npmjs.org` (installs) and `raw.githubusercontent.com` (openai spec)

## Setup

```bash
cd scripts/benchmark/v4-vs-v5

# 1. install the two isolated dependency trees
(cd v4 && npm install)
(cd v5 && npm install)

# 2. fixtures (petStore + twitter are copied from the monorepo checkouts; openai is fetched)
mkdir -p fixtures
cp ../../../packages/adapter-oas/mocks/petStore.yaml fixtures/petStore.yaml
cp /path/to/kubb-labs/plugins/schemas/3.0.x/twitter.json fixtures/twitter.json
curl -s https://raw.githubusercontent.com/openai/openai-openapi/main/openapi.yaml -o fixtures/openai.yaml
```

## Run

```bash
node run.mjs
```

The orchestrator prints a live per-configuration log to stderr and writes `results/results.json`. A
full run takes several minutes — `openai.yaml` with the full plugin combo is the slowest
configuration on both versions.

## What it measures

For every (spec × plugin combo × version), `run.mjs` spawns 3 isolated `node --expose-gc` child
processes (see `v4/run-one.mjs` / `v5/run-one.mjs`) and reports the median across them:

- **Time** — wraps only the generation call (`build()` for v4, `kubb.safeBuild()` for v5) with
  `performance.now()`.
- **Memory** — `global.gc()` runs immediately before and after the generation call;
  `process.memoryUsage().rss` is sampled every 20ms throughout to also capture peak RSS. A fresh
  process per iteration keeps heap state from leaking across runs.

Both versions write their generated files to a fresh `.out/` directory per run (`fsStorage`
semantics) — v4 has no in-memory-only mode (`@kubb/core@4.39.2`'s `build()` unconditionally installs
`fsPlugin`, which writes on `file:processing:update` regardless of `output.write`), so both sides do
real filesystem I/O for a fair, apples-to-apples comparison.

Plugin combos:

- **ts** — `plugin-ts` only
- **ts-client** — `plugin-ts` + client (v4 `plugin-client`, v5 `plugin-axios`)
- **full** — `plugin-ts` + client + `plugin-zod` + `plugin-faker`

## Methodology caveats

- v4 and v5 emit **different file counts** for the same spec + plugin set (v5 groups/structures
  output differently, generally into fewer files). This measures end-to-end generation of each
  version's natural output, not generation of byte-identical file trees.
- `openai.yaml` is fetched live from `openai/openai-openapi`'s default branch, so its operation count
  grows over time — re-running this harness later will benchmark a larger spec than last time, which
  is expected and worth noting when comparing runs.
- Absolute numbers are machine-dependent. The relative speedup / memory-reduction percentages are the
  portable takeaway. Re-run on the target machine to reproduce.
- 3 iterations per configuration is enough to see the effect size (v5 wins every configuration by a
  wide margin) but not enough to report tight confidence intervals — treat the numbers as directional
  and reproducible, not statistically rigorous.

## Output shape

`results/results.json` contains `summary` (one row per version × spec × combo, with median/min/max
duration, median peak/delta RSS, file count, and error list) and `rawRuns` (every individual
iteration, for anyone who wants to recompute other statistics).
