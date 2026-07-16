---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

Add `runGeneration` to `@kubb/core`. It runs one build and its output passes end to end and emits the surrounding `kubb:generation:*` lifecycle hooks, so a host no longer repeats that sequence. The CLI, the bundler plugin, and the MCP tool now call it, each injecting its own tool passes, diagnostic rendering, and progress messages. Generated output is unchanged.
