---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

Add a `generate` method to the `Kubb` instance returned by `createKubb`. It runs one build and its output passes end to end and emits the surrounding `kubb:generation:*` lifecycle hooks, so a host no longer repeats that sequence. It also emits `kubb:setup:start` and `kubb:setup:end` around setup, so hosts can narrate that step from the emitter. Build problems go out on the `kubb:error` and `kubb:diagnostic` hooks, so each host renders and routes them from its own listeners. The CLI, the bundler plugin, and the MCP tool now call `generate`, the CLI passing its format and lint passes through the `processOutput` option, and read progress from the lifecycle hooks. Generated output is unchanged.
