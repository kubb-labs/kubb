---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/adapter-oas': patch
---

Report more about each run so a host can show live progress and source locations.

- `kubb:build:start` carries `nodeCounts`, `kubb:files:processing:update` fires as each file finishes writing, and `kubb:files:processing:end` lists the paths it left `unchanged`. `Report` gains `filesUnchanged`, and `createOutputManifest` is exported.
- `Diagnostics.format` takes a `position` option, and adapters can implement the optional `createSourceLocator` (`SourceLocator` is exported from `kubb/kit`). The OpenAPI adapter resolves YAML and JSON pointers with it, and `kubb validate` uses the configured adapters.
- Diagnostic codes stay inside the terminal width instead of wrapping mid-word.
