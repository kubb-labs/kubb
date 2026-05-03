---
"@kubb/adapter-oas": minor
"@kubb/middleware-barrel": minor
"@kubb/parser-ts": minor
---

Each package now ships an `extension.yaml` file with its npm release.

- `adapter-oas` → `extension.yaml` (`kind: adapter`)
- `middleware-barrel` → `extension.yaml` (`kind: middleware`)
- `parser-ts` → `extension.yaml` (`kind: parser`)

Each file is a self-contained extension manifest: it describes the package's options, examples, and resources, and references the unified `extension.json` schema for IDE validation. Third-party adapters, middlewares, and parsers follow the same pattern — one `extension.yaml` per package with the appropriate `kind` field.
