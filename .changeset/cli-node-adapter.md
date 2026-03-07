---
"@kubb/cli": minor
---

Replace `citty` with a zero-dependency CLI layer built on `node:util` `parseArgs`.
Command runners are lazily imported via `await import()` inside each command handler, so the heavy runner logic is only loaded when that command is actually executed. Adds `defineCommand` with typed option inference, a `nodeAdapter`, and `createCLI` factory.
