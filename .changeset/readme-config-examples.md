---
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
'@kubb/mcp': patch
---

Fix the config examples in the package READMEs.

`input` took an object (`input: { path: './openapi.yaml' }`) in the examples. Kubb reads a non-string `input` as an
already-parsed spec, so that form silently produced an empty document instead of reading the file. The examples now pass
the path as a string.

The `@kubb/adapter-oas` README passed the adapter as `adapters: [adapterOas()]`, but the config key is the singular
`adapter`. It also documented `mergeDocuments`, which is no longer exported, and listed `HttpMethod` among the
re-exported types, which this package does not export. The API section now matches `src/index.ts` and documents
`adapterOasName`.

The `@kubb/mcp` README imported `pluginOas` from `@kubb/plugin-oas`, a package that no longer exists. The example now
uses `adapterOas` from `@kubb/adapter-oas`.
