---
argument-hint: [input-spec] [output-dir] [plugins]
description: Scaffold a kubb.config.ts and install plugins, mirroring `kubb init`. Use the Kubb MCP server's init tool.
---

Scaffold Kubb in the current project, mirroring the `kubb init` command. Arguments map to the
CLI flags: an OpenAPI spec (`--input`), an output directory (`--output`), and a comma-separated
plugin list (`--plugins`). Read the `config` skill before choosing plugins.

Parsed from **$ARGUMENTS** (ask only for what is missing):

1. **Plugins.** Map the requested outputs to `@kubb/plugin-*` packages with the `config` skill.
   Valid values: `plugin-ts`, `plugin-client`, `plugin-react-query`, `plugin-vue-query`,
   `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-mcp`, `plugin-redoc`.
   Default to `plugin-ts` if the user is unsure.
2. **Scaffold** with the `init` tool, passing `input`, `output`, and the comma-separated
   `plugins`. The tool writes `kubb.config.ts` and does not install packages. If a config
   already exists it will refuse — edit the existing config instead of overwriting it.
3. **Install** `kubb` and each selected `@kubb/plugin-*` package as dev dependencies with the
   project's package manager (detect it from the lockfile). This matches what `kubb init` does
   after scaffolding.
4. Suggest running `/kubb:generate` next.
