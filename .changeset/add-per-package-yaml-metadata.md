---
"@kubb/adapter-oas": minor
"@kubb/middleware-barrel": minor
"@kubb/parser-ts": minor
---

Each package now ships a type-specific metadata YAML file with its npm release.

- `adapter-oas` → `adapter.yaml`
- `middleware-barrel` → `middleware.yaml`
- `parser-ts` → `parser.yaml`

Each file describes the package's options, examples, and resources, and references the matching JSON schema for IDE validation. Third-party adapters, middlewares, and parsers can follow the same pattern using the corresponding `$schema` URL.
