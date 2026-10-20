---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/adapter-oas': patch
---

Report more per run: `kubb:build:start` carries `nodeCounts`, `kubb:files:processing:update` fires per written file, `kubb:files:processing:end` lists `unchanged` paths, and `Report` gains `filesUnchanged`. `Diagnostics.format` takes a `position`; adapters can implement `locate`, which the OpenAPI adapter does for YAML and JSON pointers. `kubb validate` uses the configured adapters. Diagnostic codes no longer wrap mid-word.
