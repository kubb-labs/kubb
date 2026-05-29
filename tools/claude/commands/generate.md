---
argument-hint: "[input-spec]"
description: Run Kubb code generation with the kubb generate CLI and report what changed.
---

Run the `kubb generate` CLI. The optional **$ARGUMENTS** is an input spec that overrides the
config's input.

1. Confirm a `kubb.config.ts` exists. If not, suggest `/kubb:init` and stop.
2. Run generation:

   ```shell
   npx kubb generate
   ```

   Pass the spec as the first argument to override the input (`npx kubb generate ./openapi.yaml`),
   `--config <path>` for a non-default config location, and `--verbose` when a run produced
   unexpected or missing output. Use `--watch` to regenerate on spec changes.
3. Summarize the generated files grouped by output folder, and surface any warnings.

Do not hand-edit files under the generated output directory, since they are overwritten on every
run. Change the spec or the config instead, then regenerate.
