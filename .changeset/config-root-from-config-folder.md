---
'unplugin-kubb': patch
'kubb': patch
'@kubb/cli': patch
'@kubb/mcp': patch
---

Resolve a config's `root` from the folder of `kubb.config.ts`, so the CLI, the bundler, the MCP server and `openapi-import` read the same paths wherever they run.

- Default `root` to the config's folder, or the folder above `.config/` and `configs/`, instead of `process.cwd()`. `defineConfig` no longer fills it in.
- Pick a config for a `*.openapi.yaml` import only when its `input` is that spec, or when it has no `input`. A config written for another spec, such as one in a parent folder, no longer applies.
- Fail an import that no config fits with `No Kubb config applies to <spec>`, including under webpack and Rspack, which hung on import errors before.
