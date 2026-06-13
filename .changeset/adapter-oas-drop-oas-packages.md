---
'@kubb/adapter-oas': patch
---

Drop the `oas` and `oas-normalize` dependencies in favor of built-in logic.

Operation iteration (paths, methods, `operationId`, tags, request/response bodies, content type) now runs through a small internal `Operation` wrapper instead of the `oas` package, and the OpenAPI type aliases come straight from `openapi-types` and `@types/json-schema`. Document loading parses inline YAML/JSON with the `yaml` package, and `kubb validate` validates with `@readme/openapi-parser` directly. Generated output and validation behavior are unchanged, while the dependency tree is considerably smaller.
