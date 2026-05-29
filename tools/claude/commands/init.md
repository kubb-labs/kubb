---
argument-hint: "[input-spec] [output-dir] [plugins]"
description: Scaffold a kubb.config.ts and install plugins by running the kubb init CLI.
---

Scaffold Kubb in the current project by running the `kubb init` CLI in the terminal. The
arguments map to its flags: an OpenAPI spec (`--input`), an output directory (`--output`), and a
comma-separated plugin list (`--plugins`). Read the `config` skill before choosing plugins.

Parsed from **$ARGUMENTS** (ask only for what is missing):

1. Choose plugins. Map the requested outputs to `@kubb/plugin-*` packages with the `config`
   skill. Valid values: `plugin-ts`, `plugin-client`, `plugin-react-query`, `plugin-vue-query`,
   `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-mcp`, `plugin-redoc`.
   Default to `plugin-ts` when the user is unsure.
2. Run init with the chosen values so it does not prompt:

   ```shell
   npx kubb init --input <input> --output <output> --plugins <comma,separated,list>
   ```

   This writes `kubb.config.ts` and installs `kubb` plus the selected packages. For a default
   setup, `npx kubb init --yes` works without flags. If a config already exists, edit it by hand
   rather than rerunning init.
3. Suggest running `/kubb:generate` next.
