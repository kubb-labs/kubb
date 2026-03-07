---
"@kubb/cli": minor
---

Replace `citty` with a zero-dependency CLI layer built on `node:util` `parseArgs`.
Commands are now loaded lazily via `await import()` for faster startup. Adds `defineCommand` with typed option inference, a `nodeAdapter`, and `createCLI` factory.
