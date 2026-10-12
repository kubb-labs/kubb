---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Generate from a plain JSON Schema file, and mark schemas that stand for an existing TypeScript type with `x-kubb-type`.

- Accept a JSON Schema document (YAML or JSON) as `input`. The root schema is named after its `title`, and each `$defs` entry and external `$ref` target becomes its own named schema.
- Read `x-kubb-type: { name, import }` on any schema into the new `customType` field on schema nodes, for values JSON Schema cannot describe, such as functions or a `RegExp`. Printers still print `unknown` for these schemas until they read `customType`.
- Ignore an invalid `x-kubb-type` value with a `KUBB_INVALID_SPEC` warning.

```yaml
# options.schema.yaml
title: Options
type: object
properties:
  resolver:
    x-kubb-type: { name: ResolverPatch, import: kubb/kit }
```
