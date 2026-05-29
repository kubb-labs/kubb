---
argument-hint: [path-or-url-to-openapi-spec]
description: Scaffold Kubb in this project — validate the spec, write kubb.config.ts, install packages, and run the first generation.
---

Set up Kubb code generation in the current project for the OpenAPI spec at **$ARGUMENTS**
(ask for the spec path or URL if it is empty). Use the Kubb MCP server's tools, and read the
`config` skill before writing any config.

1. **Validate** the spec with the `validate` tool. If it fails, report the errors and stop.
2. **Choose plugins.** Ask which generated outputs the user wants (types, client, framework
   hooks, Zod, mocks, ...) and map them to `@kubb/plugin-*` packages using the `config` skill.
   Default to `plugin-ts` if they are unsure.
3. **Scaffold** `kubb.config.ts` with the `init` tool, passing the spec as `input`, a sensible
   `output` (such as `./src/gen`), and the selected `plugins`. If a config already exists, do
   not overwrite it — edit it instead.
4. **Install** `kubb` and each selected `@kubb/plugin-*` package as dev dependencies using the
   project's package manager (detect from the lockfile).
5. **Generate** once with the `generate` tool to confirm the setup works, then summarize the
   files that were produced and how to import them.
