# Research, architecture review against established projects

> A second research note for PR #3444. The first report (`research.md`) stays inside the current
> design and cleans it up. This one steps back and asks what Kubb's core could borrow from larger
> code-processing projects: TypeScript, Vite, Vue, esbuild, oxc/oxlint, TanStack Query, and the
> plugin and tooling ideas from Rust and Python. Each section names what the reference does, what
> Kubb does today with a file reference, the change worth making, and the tradeoff. Nothing here is
> committed work, and the bigger items are flagged as such.

## How Kubb maps to these projects today

Kubb is already shaped like the good examples in this space. It splits a framework-agnostic core
from adapters and renderers the way TanStack keeps `query-core` separate from `react-query`. It
streams schemas and operations as async iterables instead of buffering, which is the pull model
esbuild and Rollup favour. It orders plugins with `enforce` like Vite, and it cleans up resources
with `using` and `dispose`. So the gaps below are about maturity in four areas the big projects
have invested in heavily: incremental work, a typed plugin protocol, a real diagnostics model, and
CPU parallelism.

Each row links to the section that explains it, with the same impact, effort, and risk shorthand
as `research.md`. The Kubb gap each one closes is described in its section below.

| ID | Idea | Borrow from | Impact | Effort | Risk |
| --- | --- | --- | --- | --- | --- |
| A1 | Incremental build cache and a dependency graph | tsc, Vite, mypy, Turbopack | High | High | Medium |
| A2 | Typed hook protocol with declared hook kinds | Rollup, Vite, pytest pluggy | High | Medium | Low |
| A3 | Explicit parse, transform, generate phases | Vue, Babel, SWC | Medium | Medium | Low |
| A4 | Structured diagnostics with codes and source spans | tsc, ariadne, codespan, miette | High | Medium | Low |
| A5 | Parallel rendering across CPU cores | esbuild, oxc, SWC | Medium | High | Medium |
| A6 | String interning and a flatter AST | oxc, V8 | Low | High | Medium |
| A7 | A versioned core protocol for plugins | TanStack Query, Vite | Medium | Low | Low |

## A1. Incremental generation and a real dependency graph

TypeScript writes a `.tsbuildinfo` so a rebuild only touches what changed. Vite caches pre-bundled
dependencies under `node_modules/.vite` and keys them by a hash of lockfile and config. mypy and
Turbopack do the same with content hashes. The shared idea is to remember what produced what, then
skip inputs whose hash has not moved.

Kubb regenerates everything on every run. Watch mode calls the full `generate()` on any file change
(`packages/cli/src/runners/generate/run.ts:288-300`), and the `createHash` already in the CLI is
only used to dedupe post-generate hook commands, not to skip unchanged output. On a large spec in a
dev loop this is the single biggest cost.

The change is a build manifest that maps a hash of each operation or schema, plus the resolved
plugin options and the Kubb version, to the output paths it produced. On the next run, inputs whose
hash is unchanged skip their generators, and the manifest tells the cleaner which stale files to
remove. This pairs with the pre-scan finding from `research.md` (P1): instead of draining all
schemas into memory to compute reachability, build an explicit graph of schema to dependent
operation to output file once, then reuse it for both pruning and incremental skips. This is the
largest item here and deserves its own spec before any code, because cache invalidation is where
these systems get subtle.

## A2. A typed hook protocol

Rollup and Vite give plugins a typed context object and a fixed set of hooks with declared kinds:
some run in sequence, some in parallel, and some stop at the first non-null result. pytest's pluggy
goes further with hook specifications and implementations marked `tryfirst`, `trylast`, and
`hookwrapper`, plus `firstresult` hooks. The point is that the hook surface is a typed contract,
not a bag of events.

Kubb ran on a raw `AsyncEventEmitter` with string-keyed event names, and the listener type was
erased to `(...args: Array<never>)` at every registration site. The two listener-tracking
structures noted in `research.md` (C1) existed because the emitter had no typed registry.

PR #3445 shipped the typed-tracker half of this idea. A `HookRegistry` wraps the existing
`AsyncEventEmitter` (`packages/core/src/HookRegistry.ts`), tracks each listener with a `HookSource`
tag (`'plugin' | 'middleware' | 'driver'`), and gives the driver one typed `register()` /
`dispose()` surface. The `#hookListeners` and `#middlewareListeners` structures in `KubbDriver` are
gone, every `(...args: Array<never>)` cast in the driver is removed, and external listeners
attached directly via `kubb.hooks.on(...)` survive `dispose()`. The public `definePlugin`,
`KubbHooks`, and `kubb.hooks` surfaces are unchanged.

What is deliberately not in #3445: the declared hook-kind table. Every current `KubbHooks` event
is sequential and the driver still dispatches through `hooks.emit(...)`, so a `HookKind` enum, a
`kubbHookKinds` table, and a `registry.invoke(...)` router would all be dead infrastructure
today. The kind machinery comes back the day a hook actually needs `firstResult` (Rollup-style
short-circuit on the first non-nullish return) — at that point the change is one row in the kind
table and one call site that uses `invoke` instead of `emit`.

## A3. Parse, transform, generate as explicit phases

Vue's compiler is three named stages: `baseParse` produces an AST, `transform` runs an ordered list
of node transforms and directive transforms, and `generate` prints code. Babel and SWC use the same
visitor-over-phases shape. Keeping the stages separate is what lets each be tested and extended on
its own.

In Kubb the transform step is folded into the driver. `#runGenerators` applies the per-plugin
transformer inline while it walks and dispatches nodes
(`packages/core/src/KubbDriver.ts:577` onward), so orchestration and transformation are tangled in
the same method. A plugin author reasoning about how to rewrite a node before generation has to
read the driver to find out.

The change is to lift transform into a first-class stage: an ordered pipeline of node transforms
that runs between the adapter's AST and the generators, registered the way Vue registers node
transforms. The driver then orchestrates three clear phases instead of one large loop, which also
shrinks the `#runGenerators` hot path from `research.md` (C1).

## A4. A diagnostics model instead of thrown errors

TypeScript reports problems as structured diagnostics: a stable code, a category, a message, a
source span, and related information. Rust's compiler and libraries like ariadne and codespan, and
oxc through miette, render those spans as annotated source frames. The value is that a failure
points at the exact place in the input and can be collected rather than thrown on the first
problem.

Kubb throws generic errors with a `[kubb]` prefix and wraps plugin failures in `BuildError` from
`@internals/utils`, with no code, no category, and no pointer back into the OpenAPI document. This
is the M3 item from `research.md`, and the reference projects show what the target looks like.

The change is a `Diagnostic` type carrying a code, a severity, a message, and a source location
expressed as a JSON pointer into the spec, collected into the build result and rendered by the CLI
as an annotated frame. Generators and resolvers emit diagnostics instead of throwing, so one bad
operation no longer has to abort the run and the user sees where the problem is.

## A5. Parallelism across cores, with honest limits

esbuild owes much of its speed to Go goroutines processing files in parallel, and oxc and SWC use
Rust threads through rayon. Kubb runs on a single event loop and gets concurrency from async
batching at width 8 (`SCHEMA_PARALLEL` in `packages/core/src/constants.ts`). That overlaps IO well,
but the JSX render and TypeScript print for each file are CPU-bound and still run on one thread.

A `worker_threads` pool, through something like piscina, could shard rendering across cores for
large specs. The honest caveat is that JavaScript is not Go or Rust here: passing nodes to workers
costs serialization, so this only pays off past a size threshold and the single-threaded path should
stay the default. Worth prototyping and measuring on a big spec before committing, not adopting on
faith.

## A6. String interning and a flatter AST

oxc interns identifiers as atoms and allocates AST nodes in an arena, which cuts both memory and the
pointer chasing that hurts cache locality. V8 does its own string deduplication for similar reasons.
Kubb allocates a node per schema and per operation, and repeated identifiers like schema names and
`$ref` targets are fresh strings each time.

Interning identifiers and sharing immutable nodes would lower memory and GC pressure on very large
specs. In a JavaScript codebase the win is smaller than in Rust, so this ranks below the items
above and is mainly worth it once the dependency graph from the incremental work already gives a
natural place to hold interned names.

## A7. A versioned core protocol for external plugins

TanStack keeps a small `query-core` that adapters target, and Vite's Environment API formalized the
contract between core and its consumers. Kubb already splits core, adapters, renderers, and plugins
cleanly, and the plugins live in their own monorepo. What is missing is a written, versioned
description of the contract those external plugins target: the hook surface, the node shapes, and
the resolver interface. Publishing that protocol as a documented and versioned surface lets plugin
authors track breaking changes deliberately. This is low effort and high onboarding value, and it
builds directly on the architecture document proposed in `research.md` (M1).

## Suggested order

A2's typed-tracker half shipped in #3445; the hook-kind table is parked until a `firstResult`
consumer arrives. Take diagnostics (A4) next, since it is also mostly internal, lifts error
quality immediately, and makes the later work easier to reason about. Do the transform-phase
extraction (A3) after that, because it cleans up the same driver hot path the first report
flagged. Treat incremental generation (A1) as its own spec with a measurement gate, since it is
the highest payoff and the highest risk. Hold the worker pool (A5) and AST interning (A6) until a
profile on a large spec shows they earn their complexity. The core-protocol document (A7) can run
in parallel with any of these.

## Open questions

1. Is the dev-loop rebuild cost large enough on real specs to justify an incremental cache and the
   invalidation complexity it brings, or is watch-mode full rebuild acceptable for now?
2. ~~Should the typed hook protocol replace `AsyncEventEmitter` outright, or wrap it so the public
   surface and external plugins stay untouched?~~ Resolved in #3445: wrap. `HookRegistry` owns
   listener tracking, `AsyncEventEmitter` stays the dispatch layer, and `kubb.hooks` keeps its
   public type.
3. Where does the `Diagnostic` type live, core or `@internals/utils`, given the same question is
   open for the error model in `research.md`?

## Operating constraints

The same limits from `research.md` apply: ESM only, Node 22, a stable public API through the
`exports` map, the core size-limit, and a green suite. Anything that adds a worker pool or a cache
must keep the current single-threaded, no-cache path working as the default so behavior does not
change for existing users.

## Libraries and projects referenced

Every external project named across both reports, with the idea Kubb would borrow and the items it
informs.

| Project | Borrowed idea | Items |
| --- | --- | --- |
| TypeScript (tsc) | Incremental `.tsbuildinfo` rebuilds, structured diagnostics | A1, A4 |
| Vite | Pre-bundle cache keyed by hash, `enforce` ordering, Environment API, `defineConfig` | A1, A2, A7 |
| Rollup | Typed plugin context and a fixed hook surface | A2 |
| Vue compiler | The parse, transform, generate phase split and ordered node transforms | A3 |
| Babel | Visitor-over-phases and the preset and plugin model | A3 |
| SWC | Rust visitors and rayon parallelism | A3, A5 |
| esbuild | Go goroutine parallelism and the pull-based model | A5 |
| oxc and oxlint | Interned atoms, arena allocation, and miette diagnostics | A4, A6 |
| TanStack Query | A framework-agnostic `query-core` with thin adapters | A7 |
| pytest and pluggy | Hook specs with `tryfirst`, `trylast`, `hookwrapper`, and `firstresult` | A2 |
| mypy | An incremental type-check cache | A1 |
| Turbopack | Content-hash caching | A1 |

Supporting libraries and runtimes named for the proposed changes.

| Library or runtime | Role in the proposals |
| --- | --- |
| Rust ariadne | Annotated diagnostic frames (A4) |
| Rust codespan | Diagnostic source spans (A4) |
| miette | Diagnostic rendering used by oxc (A4) |
| rayon | Data parallelism in the Rust tools (A5) |
| Go goroutines | The parallelism model behind esbuild (A5) |
| V8 | Runtime string deduplication (A6) |
| Node `worker_threads` | The thread-pool primitive (A5) |
| piscina | A worker pool built on `worker_threads` (A5) |
| `node:crypto` `createHash` | Hashing for the build manifest (A1), already used in the CLI |

Kubb packages and tooling these proposals touch.

| Kubb package or tool | Where it appears |
| --- | --- |
| `@kubb/core`, `@kubb/ast`, `@kubb/cli`, `@kubb/kubb` | The core packages under review |
| `@internals/utils` | `BuildError`, `AsyncEventEmitter`, `URLPath` (A2, A4, and M3, M5 in `research.md`) |
| `@kubb/renderer-jsx` | The JSX renderer behind the CPU-bound printing (A5) |
| chokidar | The CLI file watcher behind watch mode (A1) |
| `size-limit` | The bundle budget on `@kubb/core` (M6 in `research.md`) |
