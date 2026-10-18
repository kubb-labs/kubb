---
'@kubb/cli': minor
---

Make `kubb init` detect the project first. It names the package manager, TypeScript, the framework, and the data libraries, and offers the OpenAPI specs it finds in the repo. It pre-selects the plugins that match your dependencies, with the reason, and shows the full `kubb.config.ts` for review before writing it. After setup it adds a `generate` script when there is none and runs the first generation. `--plugins` also takes short names such as `ts,zod`, and `--yes` prints one line per step.
