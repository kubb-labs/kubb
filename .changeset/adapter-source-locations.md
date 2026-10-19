---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/adapter-oas': patch
'@kubb/cli': patch
---

Let adapters supply source ranges for CLI diagnostic frames and use configured adapters during validation.

- Add the optional `Adapter.createSourceLocator` method and export `SourceLocator` for adapter authors.
- Resolve YAML and JSON pointers in the OpenAPI adapter.
- Use `kubb validate --config` or the discovered config's adapters, reporting their names.
- Remove framework detection and dependency-based plugin recommendations from `kubb init`.
