---
argument-hint: [path-to-kubb.config.ts]
description: Run Kubb code generation from a kubb.config.ts and report what changed.
---

Generate code with Kubb using the config at **$ARGUMENTS** (default to `./kubb.config.ts` if
empty). Use the Kubb MCP server's `generate` tool.

1. Confirm a `kubb.config.ts` exists. If not, suggest `/kubb:init` and stop.
2. Call the `generate` tool with the config path. Use `logLevel: 'verbose'` if a previous run
   produced unexpected or missing output.
3. Summarize the generated files grouped by output folder. Surface any warnings.
4. If the user mentions an input or output that differs from the config, pass `input` / `output`
   as overrides rather than editing the config.

Do not hand-edit files under the generated output directory — they are overwritten on every run.
Change the spec or the config instead, then regenerate.
