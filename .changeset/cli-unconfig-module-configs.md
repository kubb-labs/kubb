---
'@kubb/cli': patch
---

Load the Kubb config with `unconfig` and accept only JavaScript and TypeScript module configs.

Discovery now matches `kubb.config.{ts,mts,cts,js,mjs,cjs}` and the matching `.kubbrc.*` variants (also under `.config/` and `configs/`). YAML, JSON, and the `package.json` `kubb` key are no longer read, since a Kubb config is defined with `defineConfig` and plugin function calls that those formats cannot express. This replaces `cosmiconfig` and its YAML and JSON loader chain, reducing install size. TypeScript and JSX configs keep loading through the existing jiti loader.
