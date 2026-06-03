---
'@kubb/middleware-logger': minor
'@kubb/cli': minor
'@kubb/core': patch
---

Extract the CLI logger into a new `@kubb/middleware-logger` package. A single consola-backed logger now handles every output environment, and when the runtime is GitHub Actions the same handlers inline workflow command annotations (`::group::`, `::endgroup::`, `::warning::`, `::error::`, `::notice::`) so the CI annotations panel highlights problems and sections collapse per config, plugin, and hook.

The package exports `createLogger(options)` as the factory and a default `middlewareLogger` instance, plus the diagnostic and formatting helpers (`formatDiagnostic`, `diagnosticSymbol`, `diagnosticHeadline`, `diagnosticDetails`, `formatMessage`, `formatCommandWithArgs`, `createHookTimer`) and the `HookSinkFactory` / `HookSinkOptions` types so other hosts can reuse them.

`@clack/prompts` is fully removed from `@kubb/cli`. The init wizard, agent runner, and generate watcher now go through consola for prompts and live output.

`@kubb/core` patches a type bug in `createReporter<T>`'s no-`flush` branch so the returned `Reporter.report` correctly discards the `T` value rather than mistyping the callback.
