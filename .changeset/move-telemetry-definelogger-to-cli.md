---
'@kubb/core': minor
'@kubb/cli': minor
---

Move `Telemetry`, `defineLogger`, Logger types (`Logger`, `LoggerContext`, `LoggerOptions`, `UserLogger`), and `selectReporters` from `@kubb/core` to `@kubb/cli`. These exports were only ever used by the CLI. `logLevel` remains exported from `@kubb/core`. Programmatic users of `createKubb` are unaffected.
