# Reduce `@kubb/core` layers — execution plan

Turn the seven architecture findings (F1–F7) into an ordered, behavior-preserving
refactor. Every slice is one pull request, one changeset, and produces byte-identical
output.

## Guiding principles

- **Refactor, not rewrite.** The bytes Kubb writes to disk stay identical.
- **One hop per PR.** Small, revertible slices.
- **Public hooks stay public.** Only internal wiring changes; `kubb:generate:*` and the
  lifecycle hooks keep working for external listeners.

## At a glance

| Slice | From | Goal | Effort | Semver | Path |
| ----- | ---- | ---- | ------ | ------ | ---- |
| S0 | — | Characterization tests: pin hook order, file output, options & resolver results | S | none | critical |
| S1 | F4 | Make `plugin.setup()` an explicit method, not a phantom hook | S | minor → major | critical |
| S2 | F3 | Normalize plugin options at registration; `setOptions` becomes override-only | M | patch | critical |
| S3 | F7 | `FilesPayload` getter class replaces the spread footgun | S | patch | parallel |
| S4 | F1 | Call generators directly; keep `kubb:generate:*` observe-only | L | patch | critical |
| S5 | F6 | Single-pass operations — reuse the kept nodes for the batch hook | XS | patch | in S4 |
| S6 | F5 | One `getResolver`, one map, drop the mirror | M | patch | parallel |
| S7 | F2 | Shared `runGeneration` runner; migrate CLI → unplugin → MCP | L | minor | parallel |

Effort is relative: `XS < S < M < L`. "minor → major" means ship a back-compat shim now
(minor), remove the old surface in the next major.

## Sequence and dependencies

```
critical path:   S0 ─► S1 ─► S2 ─► S4 (+S5)
parallel (need S0 only):   S3    S6    S7
```

- **S0 gates everything** — the safety net has to exist before the first hop comes off.
- **S1** makes the plugin setup surface explicit, which **S2** and **S4** both build on
  (options and generators are wired there).
- **S2** makes options real before the generate loop runs, so **S4** can dispatch without
  the placeholder dance.
- **S5** is folded into the **S4** loop rewrite rather than shipped alone.
- **S3, S6, S7** depend on S0 only, so a second contributor can take them in parallel.

## Definition of done (every slice)

- **One PR per slice** (S5 rides in S4).
- **S0 oracle unchanged** — file output, hook order, options and resolver snapshots all
  identical.
- **Green gate:** `pnpm format && pnpm lint:fix && pnpm typecheck && pnpm test`.
- **Changeset** with the semver from the table (S1 carries the deprecation note, S7 the new
  export).
- **Docs** touched only where a public surface moves: S1 → the kubb.dev plugin-authoring
  page, S7 → the runner export.

---

## Phase 0 — Baseline and guardrails

No behavior change. Build the net that proves every later slice preserves output.

### S0 — Characterization tests

Pin the observable behavior the refactor must not change.

- **Scope:** a multi-plugin fixture build (for example `ts` + `zod` + a barrel) run against
  `memoryStorage()`, asserting on stable outputs.
- **Pin:**
  - hook firing order — record the sequence of `callHook` names for external listeners
  - generated file set and source — snapshot
  - options normalization per plugin
  - resolver resolution for names and paths
- **Verify:** suite green on the current branch; these snapshots become the oracle for
  S1–S7.
- **Compat:** test-only, no shipped change.
- **Files:** `packages/core/src/*.test.ts` (new), reuse `mocks.ts` fixtures.

---

## Phase 1 — Clean the setup surface

Cheap enablers that make the plugin wiring explicit and de-risk the headline slice.

### S1 — `plugin.setup()` as a real method (F4)

Stop pretending `kubb:plugin:setup` is an emitter hook.

- **Change:** add an explicit `setup?(ctx)` to the `Plugin` type. `KubbDriver.setupHooks`
  calls `plugin.setup?.(ctx)`. Keep reading `hooks['kubb:plugin:setup']` as a deprecated
  fallback for one minor; drop it (and remove the key from `KubbHooks`) at the next major.
- **Verify:** S0 hook-order and file snapshots unchanged. Add a test that a plugin using
  `setup()` and one using the legacy hook wire up identically.
- **Compat:** the public `Plugin` shape changes. The shim accepts both forms → **minor +
  deprecation notice**; removal is the major. Update the kubb.dev plugin-authoring docs.
- **Files:** `definePlugin.ts` (`Plugin.hooks` / `setup`), `KubbDriver.ts:178–186`,
  `194–228`, `types.ts:393`.

### S2 — Normalize options at registration (F3)

Kill the `{ path: '.' }` placeholder and the three-state options.

- **Change:** derive normalized `options` (output via `normalizeOutput`, plus
  `exclude`/`include`/`override`) from the plugin's declared defaults at `setup()`
  registration instead of seeding a placeholder. `setOptions` becomes a shallow
  merge-override, not the mandatory init step.
- **Verify:** S0 options-normalization snapshot identical for every fixture plugin,
  including one that never calls `setOptions`.
- **Compat:** internal. Plugins that declare defaults are unaffected; the only behavior
  change is that forgetting `setOptions` now yields correct defaults instead of the
  placeholder. **patch.**
- **Files:** `KubbDriver.ts:92–116` (setup seed), `216–222` (setOptions),
  `definePlugin.ts:119–134`.

### S3 — `FilesPayload` getter class (F7)

Encode the "don't spread me" rule in a type, not a comment.

- **Change:** replace `#filesPayload()` and the `Object.assign` convention with a small
  class instance exposing a lazy `files` getter and `upsertFile`. Pass the instance into
  hook contexts directly, so spread cannot capture a stale snapshot.
- **Verify:** S0 snapshots unchanged; add a regression test that a `build:start` listener
  spreading the ctx still sees files added later (the current footgun would fail this).
- **Compat:** internal only. **patch.** Independent of every other slice — land whenever.
- **Files:** `KubbDriver.ts:390–409` and its `Object.assign` call sites (`331`, `370`,
  `407`).

---

## Phase 2 — Direct generator dispatch

The headline win. Take the generators off the event bus and call them directly.

### S4 — Call generators directly (F1)

Remove the wrap-closure, the name-guard, and the N²·M fan-out.

- **Change:** populate `NormalizedPlugin.generators` in `addGenerator`. In
  `#runGenerators`, iterate `plugin.generators` and `await gen.schema/operation(node, ctx)`,
  then `dispatch(result, gen.renderer)`. Delete the `wrap()` closure, the
  `ctx.plugin.name !== pluginName` guard, the `addHooks` registration for
  `kubb:generate:*`, and the `listenerCount` gating. Emit `kubb:generate:*` **once per
  node** only when an external listener is present, so the public hook survives for
  observers.
- **Verify:** S0 file-output snapshot byte-identical. S0 external hook-order test:
  `kubb:generate:*` still fires once per node for a registered listener. Optional perf
  assertion that listener invocations drop from N²·M to N·M.
- **Compat:** `kubb:generate:*` stay public → external listeners unaffected. Internal
  dispatch only. **patch.**
- **Files:** `KubbDriver.ts:243–266` (registerGenerator), `355–368`, `426–555`
  (runGenerators), `definePlugin.ts` (`NormalizedPlugin.generators`).

### S5 — Single-pass operations (F6)

Stop re-resolving every operation for the batch hook. Ships inside the S4 PR.

- **Change:** during the per-operation pass, push each kept (transformed and filtered) node
  into an array. Feed that array to the `operations()` batch instead of a second `reduce`
  over all operations that calls `resolveForPlugin` again.
- **Verify:** S0 test asserting the `operations()` batch receives exactly the same set as
  before, in the same order.
- **Compat:** internal. **patch.** The loop is being rewritten in S4 anyway.
- **Files:** `KubbDriver.ts:515–543`.

---

## Phase 3 — Resolver surface

Independent cleanup — collapse the four access paths to one.

### S6 — One resolver accessor (F5)

Fold two maps into one; drop the `plugin.resolver` mirror.

- **Change:** keep a single `getResolver(name)` that lazily creates and caches the merged
  resolver in one map. Make `plugin.resolver` a getter that delegates to it
  (source-compatible) rather than a mirrored field kept in sync by `setPluginResolver`.
  `ctx.resolver` stays the one public path.
- **Verify:** S0 resolver-resolution snapshot unchanged. Test that `setResolver` in
  `setup()` is reflected through `ctx.resolver`, `ctx.getResolver(name)` and
  `getPlugin(name).resolver` identically.
- **Compat:** `getResolver` signature unchanged; `plugin.resolver` read-compatible.
  **patch.** Depends on S0 only.
- **Files:** `KubbDriver.ts:620–647` (maps / getResolver), `627–636` (setPluginResolver).

---

## Phase 4 — Shared host runner

The biggest lift, but off the driver's critical path. One sequence instead of three copies.

### S7 — Extract `runGeneration()` (F2)

Lift the lifecycle + format/lint/postGenerate loop out of the CLI.

- **Change:** move the surrounding sequence — `lifecycle`/`generation:start`, the build,
  format → lint → `postGenerate`, `generation`/`lifecycle:end` — into a shared
  `runGeneration(config, { hooks, tools, logger })` in `@kubb/core` (or a new
  `@kubb/runner`). Parameterize the shell executor and logger so hosts inject their own.
- **Rollout:** migrate the **CLI first** (reference host, best-tested), confirm parity,
  then port **unplugin**, then **MCP** — one PR each. Each host PR keeps only flag parsing,
  watch mode, and its logger.
- **Verify:** CLI end-to-end output and exit codes unchanged; the unplugin and MCP ports
  reproduce their current emitted-hook sequences.
- **Compat:** adds a public export to `@kubb/core`; host-internal otherwise. **minor.**
  Independent of S1–S6 — a second contributor can start once S0 exists.
- **Files:** `cli/runners/generate/run.ts:122–246`,
  `unplugin-kubb/src/unpluginFactory.ts:98–135`, `mcp/src/tools/generate.ts`, new
  core/runner export.

---

## Risk register

| Risk | Mitigation |
| ---- | ---------- |
| **S4 changes output** — rewriting the hot loop could reorder files or drop a node. | S0 byte-level snapshot is the gate; S4 cannot merge until it matches. |
| **External `kubb:generate:*` listeners** — someone relies on the hook firing. | Keep emitting it once per node when a listener exists; S0 pins the order. |
| **S1 breaks plugin authors** — moving setup off the hook map is public. | Back-compat shim accepts both forms for a minor; removal deferred to a major with a migration note. |
| **S7 host drift** — three hosts must stay in parity during migration. | Land CLI first as the reference; port others one PR at a time, each proving its own hook sequence. |
| **Cross-copy resolver merge** — S6 must not disturb the `Symbol.for` merge that survives dual `@kubb/core` copies. | Leave `Resolver.merge` untouched; only change how the driver stores and reaches resolvers. |

## Suggested landing order

- **Sprint 1:** S0 → S1 → S2. Ship S3 alongside (parallel, trivial).
- **Sprint 2:** S4 (+S5), the win, behind the S0 gate. Start S7's CLI extraction in
  parallel.
- **Sprint 3:** S6 cleanup; finish S7's unplugin and MCP ports.

Net effect once all seven land: the generator dispatch layer and its quadratic fan-out are
gone, plugin setup and options are explicit and declarative, the resolver has one door, and
the run lifecycle lives in one place instead of three — without a single change to what Kubb
writes to disk.

---

> Line numbers reference source on `claude/kubb-core-architecture-o5pn0c` and may drift.
> Effort and semver are directional — confirm against the changeset at PR time.
