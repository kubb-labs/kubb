---
'@kubb/core': minor
'@kubb/cli': patch
---

Add `runGeneration` to `@kubb/core`. It runs one build and its output passes end to end and emits the surrounding `kubb:generation:*` lifecycle hooks, so a host no longer hand-rolls that sequence. The CLI now calls it and injects its own tool passes and telemetry. Generated output and CLI behavior are unchanged.
