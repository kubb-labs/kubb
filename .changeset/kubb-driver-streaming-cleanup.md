---
'@kubb/core': minor
---

`KubbDriver` and `createKubb` are cleaned up around the always-stream architecture.

- `STREAM_SCHEMA_THRESHOLD` constant is removed. All builds now go through the streaming code path regardless of spec size.
- Studio-related state (`source`, `isOpen`, `inputNode`) is consolidated into a single `#studio` object on `KubbDriver` instead of three separate private fields.
- `runAstPlugin` is removed from `createKubb`. `runPlugins` is the only plugin runner now.
- Plugin lifecycle events (`kubb:plugin:start`, `kubb:plugin:end`) fire for every plugin, including those without an adapter configured.
- `middlewareListeners`, `#eventGeneratorPlugins`, and `hasEventGenerators` replace the previous public `middlewareListeners`, `#pluginsWithEventGenerators`, and `hasRegisteredGenerators` for naming consistency.
