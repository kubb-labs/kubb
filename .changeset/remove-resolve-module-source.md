---
"@kubb/core": patch
"@kubb/plugin-client": patch
"@kubb/plugin-zod": patch
---

refactor: replace resolveModuleSource with static imports and build-time template inlining

Removed `resolveModuleSource` from `@kubb/core/utils`. Template file contents for `@kubb/plugin-client` (config, axios, fetch) and `@kubb/plugin-zod` (ToZod) are now inlined as string constants at build time via the `importAttributeTextPlugin` rolldown/tsdown plugin, using `import ... with { type: 'text' }` import attributes as the build-time marker. This eliminates all runtime filesystem reads for template sources.
