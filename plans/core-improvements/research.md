# Research, core package improvements

> Phase 1 research for reducing complexity, improving performance, and lowering the cost of
> onboarding new maintainers in the Kubb core packages (`@kubb/core` and its close neighbours
> `@kubb/ast`, `@kubb/cli`, `@kubb/kubb`). This is a research report, not a committed plan. Every
> finding points at the code it describes so a maintainer can jump straight to it.

## Current state

The core is in good shape. There is no `any` or `as any` in `@kubb/core`, no `@ts-ignore`, and
the few non-null assertions are guarded and commented. Caching already exists where it pays off:
compiled filter patterns (`defineResolver.ts:253`), resolved options behind a two-level WeakMap,
and the sorted file view that rebuilds only after a write (`FileManager.ts:129`). The pipeline is
streaming-first, walking schemas and operations as async iterables rather than buffering them, and
the public surface in `packages/core/src/index.ts` is small and cohesive.

So the work below is polish, not repair. Three files carry most of the weight and most of the
cognitive load: `createKubb.ts` (1135 lines), `KubbDriver.ts` (933 lines), and `defineResolver.ts`
(719 lines). The recommendations group into complexity, performance, and maintainer onboarding,
then close with a suggested order.

## Complexity

C1. Break up `KubbDriver.ts`. It owns plugin normalisation, hook registration, the generator
pipeline, and file flushing in one class. The generator pipeline alone (`#runGenerators`, roughly
`KubbDriver.ts:504-700`) holds the schema pre-scan, the per-node `dispatchNode` closure
(`KubbDriver.ts:577`), and `flushPending` (`KubbDriver.ts:385`). Pulling these into their own
modules turns one 933 line file into a thin orchestrator over named units that can be read and
tested on their own. The class also tracks listeners in two places, a hook map and a middleware
array. Folding them into one registry with a single dispose path removes a class of listener-leak
bugs on rebuild.

C2. Split `createKubb.ts`. Around 600 of its lines are the `Config`, `UserConfig`, `Output`, and
`Group` type definitions. Moving those into a `config.ts` leaves the `Kubb` lifecycle class and
the factory in a file you can read in one screen. While doing this, write down the lifecycle
contract: several getters throw when read before `setup()` runs, and that ordering is currently
something a reader has to reconstruct from the throw sites.

C3. Split `defineResolver.ts` by concern. Pattern matching, option resolution, path resolution
with its traversal guard, and banner and footer rendering are four separate jobs sharing one file.
Separate files make each testable in isolation and shrink the surface a path-resolution change has
to reason about.

C4. Collapse the three generator registration blocks. `registerGenerator`
(`KubbDriver.ts:304-344`) repeats the same shape for `schema`, `operation`, and `operations`:
guard on plugin name, run the method, apply the hook result, register and track the listener. A
small table over the three method names removes the repetition and makes adding a fourth hook a
one-line change.

C5. Merge the two pattern matchers. `matchesOperationPattern` and `matchesSchemaPattern`
(`defineResolver.ts:271` and `defineResolver.ts:285`) are the same idea split by node type. One
matcher that dispatches on type reads better and keeps the filter-type list in a single place.

## Performance

P1. The schema pre-scan trades memory for correctness, and that trade is worth measuring. When a
plugin filters by operation without naming schemas, `#runGenerators` drains the whole schema
iterable into an array to compute reachable names (`KubbDriver.ts:552-569`). The code already
knows this is a cost and releases the array as soon as the pre-scan returns, but on a large spec
the peak is real. This is the one item worth profiling on a big OpenAPI document before deciding
whether a two-pass or lazy-reachability design earns its complexity. Treat it as an investigation
with a measurement gate, not a change to make blind.

P2. `memoryStorage.getKeys(base)` materialises every key before filtering
(`storages/memoryStorage.ts:39-42`). Iterating the map and yielding matches avoids the full copy.
The win is small but the change is a few lines and removes an allocation from a hot path in
dry-run and test scenarios.

P3. The plugin dependency sort calls `.includes()` on each comparison
(`KubbDriver.ts:114-119`), which is quadratic in the dependency lists. Building a set per plugin
first makes it linear. Real configs rarely have enough plugins for this to matter, so this is a
tidy-up rather than a fix.

P4. Transformers run per node with no shared memoisation (`KubbDriver.ts:577` onward, applied in
both the schema and operation passes). Today plugin authors own any caching. Worth noting as a
known property rather than prescribing a core change, since a core-level cache would need a clear
invalidation story.

P5. `stringPatternCache` is a module-level map (`defineResolver.ts:253`) that lives for the
process, not the build. In a long-running host that runs many builds with varied filter patterns
it grows without bound. A per-build cache or a bounded LRU keeps the behaviour while capping the
footprint. The WeakMap option cache and the lazy sorted-files cache do not have this problem and
should stay as they are.

## New-maintainer usability

M1. Add an architecture document for `@kubb/core`. A new maintainer currently reconstructs the
mental model from a 933 line driver. One page covering the plugin lifecycle (setup, register,
generate, end), the hook event model and why middleware listeners fire after plugin listeners, the
file flow from `FileManager` merge and dedupe through `FileProcessor` streaming to `Storage`, and
the partial-failure model (the `failedPlugins` set and the `kubb:error` hook) saves every future
reader that reconstruction.

M2. Close the core test gaps. `createAdapter`, `defineGenerator`, `defineParser`, and
`defineLogger` ship without tests, and every plugin depends on the first two. These are small
factories, so the tests are cheap to write and they pin down the contracts plugin authors rely on.

M3. Give errors a shape. Validation paths throw a generic `Error`, while plugin failures use
`BuildError` from `@internals/utils`. There is no shared Kubb error type or code, so the CLI
cannot categorise what it shows. A small hierarchy or a set of codes, plus a note on which errors
are recoverable, lets the CLI surface clearer messages and lets programmatic callers branch on
cause.

M4. Documentation tidy-ups. `index.ts`, `constants.ts`, and `mocks.ts` lack the module JSDoc the
rest of the package has. Two TODOs in `definePlugin.ts` are still open: a `ByMethod` filter
alternative (`definePlugin.ts:115`) and an options type that should drop `override`
(`definePlugin.ts:197`). Resolving or removing them stops them reading as unfinished work.

M5. Document the `@internals/utils` boundary. `BuildError`, `AsyncEventEmitter`, and `URLPath` are
re-exported from there through `index.ts`, but why they live outside core is not written down. A
short note on what that package is for and what its contract is removes the puzzle.

M6. Extend `size-limit` beyond core. Only `@kubb/core` runs the 510 KiB gzip check today.
Applying the same guard to the other core packages catches bloat in the packages that grow fastest.

## Suggested order

Take the low-risk wins first, since they need no design and are covered by existing or trivial
tests: C4, C5, P2, P3, and M4. Then invest in the documentation and tests that lower onboarding
cost: M1, M2, M3, M5, and M6. Do the structural splits next, behind the same public exports so
nothing downstream moves: C2, C3, then C1. Hold P1 until it has been measured on a large spec,
because its design depends on what the profile shows.

## Open questions

1. Is the pre-scan memory peak (P1) large enough on real specs to justify a redesign, or is the
   current release-immediately approach already acceptable? Needs a profile before deciding.
2. During the file splits (C1 to C3), must every currently exported internal stay importable at
   its current path, or is the only stability guarantee the `@kubb/core` package entry?
3. Should the error model (M3) live in `@kubb/core` or in `@internals/utils` next to `BuildError`?

## Operating constraints

- ESM only, Node 22, and the public API stays stable through the `exports` map and `typesVersions`.
- `@kubb/core` must stay under the 510 KiB gzip `size-limit`.
- The test suite stays green, and any file move is followed by `pnpm lint && pnpm typecheck`.
- No behaviour change is in scope for this report. It records findings, it does not touch source.

## What this means for a follow-up plan

Each lettered item above maps to one slice. The low-risk group can ship as a single small PR. The
documentation and test group is independent and can run in parallel. The splits should land one
file at a time with the suite green between them. P1 gets a measurement slice of its own before any
code, and its result decides whether a redesign slice follows.
