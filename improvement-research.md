# Kubb improvement research

Answering the dev.to comparison *"Which OpenAPI Codegen Should You Choose? openapi-typescript
vs hey-api vs orval vs kubb"* (nyaomaru).

> Research roadmap. Each improvement below is its own section with: the problem (from the
> article), current behavior (grounded in code), the proposed change, files to touch, and how to
> verify. The recommended first focus is **Improvement 1 (reduce generated file count)**; the
> rest are documented for later.

## Background: what the article criticizes

- **Aggressive file splitting** — effectively one file per operation/schema; at ~1,200
  operations the number of files written to disk becomes a major cost. The author treats kubb
  as a CI/committed-output tool, not a fast-iteration one.
- **Slower generation at scale**, amplified by formatting/linting large file counts.
- **Inconsistent call-site signatures** across endpoints (vs hey-api's uniformity).
- **Too heavy as a first option** for "I just want a typed client" apps.

---

## Improvement 1 — Reduce generated file count (orval-style "tags-split" / group-merge mode) — PRIMARY

**Problem (article).** kubb splits "much more aggressively" than competitors; at ~1,200
operations the sheer file count makes it impractical to run on every change.

**Current behavior (code).**
- File placement is decided by the core resolver:
  `packages/core/src/defineResolver.ts` → `defaultResolvePath` / `defaultResolveFile`, with mode
  derived by `getMode()` in `packages/core/src/definePlugin.ts`.
- Only two granularities exist: **`single`** (`output.path` is a file → everything in one
  file) and **`split`** (default; `output.path` is a directory → **one file per node**).
- `group: { type: 'tag' | 'path', name? }` only changes the **sub-directory**
  (`petsController/listPets.ts`), not granularity — so it still emits N files per tag.
- Plugins drive granularity by passing the **per-node name** to the resolver, e.g.
  `resolver.resolveFile({ name: node.name, extname: '.ts' }, { root, output, group })`
  (plugins repo: `plugin-ts/src/generators/typeGenerator.tsx:47`,`:96`); every generator
  repeats this pattern.
- **Existing enabler:** `FileManager` (`packages/core/src/FileManager.ts`) already **merges
  files that share a path** (concatenates `sources`/`imports`/`exports` on `upsert`). So once
  operations resolve to a shared path, merging is already handled and tested.

There is no middle ground equivalent to **orval's `tags-split`** (one file per tag). That is the
gap.

**Proposed change.** Add an opt-in `mode` to grouping:
`group: { type: 'tag' | 'path', mode?: 'split' | 'merge', name? }` (default `'split'`).
- Extend the `Group` type in `packages/core/src/types.ts`.
- In `defaultResolveFile`/`defaultResolvePath` (`defineResolver.ts`), when
  `group.mode === 'merge'` and a `tag`/`path` is present, derive the **file name from the group
  value** (e.g. `pets.ts`) instead of the per-node name, so all nodes of a group resolve to one
  path and `FileManager` merges them. Keep the path-traversal boundary check
  (`defineResolver.ts:450-461`).
- This reuses existing merge behavior rather than new architecture, and is fully backward
  compatible.

**Files to touch.**
- `packages/core/src/types.ts` (Group type), `defineResolver.ts` (resolve logic).
- The generator call sites that repeat `resolver.resolveFile({ name, extname }, { root,
  output, group })`: `plugin-ts`, `plugin-client`, `plugin-zod`, `plugin-react-query`,
  `plugin-vue-query`, `plugin-faker`, `plugin-msw` under the plugins repo
  `packages/*/src/generators/*` (one consistent edit each). Note `createGroupConfig(...)`
  (e.g. `plugin-ts/src/plugin.ts:57`) when threading `mode` through resolved options.
- Barrel middleware (`packages/middleware-barrel/*`): merge mode produces far fewer leaf files —
  confirm/adjust `barrel`/`nested` defaults and document the recommended combo.

**Open question.** Apply merge to operations only (highest impact, safest) or also to schemas?
Operations-first is the recommended start.

**Verification.** Benchmark `split` vs `merge` file count + generation/format/lint time via the
performance harness (ideally a large ~1,200-op spec); extend the `group` snapshot tests in the
plugins repo `plugin-ts/src/generators/typeGenerator.test.ts` to assert a tag's operations
collapse into one file with correctly merged imports/exports; run `pnpm typecheck:examples`.

---

## Improvement 2 — Make the faster renderer the default

**Problem (article).** Generation is slower than hey-api, partly structural.

**Current behavior (code).** A `jsxRendererSync` path already exists in
`packages/renderer-jsx` and is ~2–4× faster than the JSX renderer, but the JSX renderer remains
the default.

**Proposed change.** Promote `jsxRendererSync` to the default (or strongly recommend it in
config/docs), keeping the JSX renderer available for compatibility.

**Files to touch.** Renderer default wiring in `packages/kubb/src/defineConfig.ts` and
`packages/renderer-jsx`; docs.

**Verification.** Re-run the performance benchmarks; ensure example snapshots are unchanged
(`pnpm test`, `pnpm typecheck:examples`).

---

## Improvement 3 — Incremental / changed-only generation

**Problem (article).** "Would not casually run it on every small change" — slow iterative dev.

**Current behavior (code).** Every run is a full rebuild; there is no delta detection between
runs — see `KubbDriver.run()` in `packages/core/src/KubbDriver.ts`. Watch mode re-walks the
whole spec on any change.

**Proposed change.** Add content-hash tracking per operation/schema and skip regenerating
unchanged nodes (cache keyed by node + resolved options). Largest, most architectural item —
schedule after Improvement 1.

**Files to touch.** `KubbDriver.ts` (build loop / cache invalidation), `FileManager.ts`
(skip-unchanged writes), watch runner in `packages/cli`.

**Verification.** Watch-mode timing on a large spec; correctness test that editing one operation
regenerates only the affected file(s).

---

## Improvement 4 — Consistent client call-site signatures

**Problem (article).** Signatures "vary more by endpoint"; hey-api stays uniform, which matters
in a 1,200-operation API.

**Current behavior (code).** Client and query hooks are generated in the plugins repo
(`plugin-client`, `plugin-react-query`, `plugin-vue-query`); signature shape varies with the
operation's params/body.

**Proposed change.** Offer an option for uniform signatures (always a single params object) so
every generated function/hook has the same call shape regardless of endpoint.

**Files to touch.** Generators under the plugins repo `plugin-client/src/generators/*` and the
query plugins; their option/types files.

**Verification.** Snapshot tests asserting uniform signatures across diverse operations;
`pnpm typecheck:examples`.

---

## Improvement 5 — Onboarding presets

**Problem (article).** "Too heavy as a first option" vs batteries-included orval/hey-api.

**Current behavior (code).** `kubb init` (`packages/cli/src/commands/init.ts`) is already a solid
interactive wizard with good defaults, but offers no named presets — users still choose among
~10 plugins.

**Proposed change.** Add named presets (e.g. `api-client` = `plugin-ts` + `plugin-client`;
`full` = ts + client + zod + react-query) selectable via `kubb init --preset <name>`, so
newcomers skip plugin composition.

**Files to touch.** `packages/cli/src/commands/init.ts` and the init runner/config generator in
`internals/shared/src/` (`init.ts`, `constants.ts`).

**Verification.** Run `kubb init --preset api-client --yes` in a scratch dir; confirm generated
`kubb.config.ts` and that `kubb generate` succeeds.

---

## Suggested sequencing

1. **Improvement 1** (file count) — highest impact, lowest risk, reuses `FileManager` merge.
2. **Improvement 2** (renderer default) — quick perf win.
3. **Improvement 5** (presets) — quick DX win.
4. **Improvement 4** (signature consistency) — medium, plugins repo.
5. **Improvement 3** (incremental builds) — largest/architectural, do last.
