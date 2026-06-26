---
'@kubb/adapter-oas': minor
'@kubb/ast': patch
---

Surface enum member descriptions from the `x-enumDescriptions` / `x-enum-descriptions` vendor extensions.

`adapter-oas` now reads these extensions alongside the existing `x-enumNames` / `x-enum-varnames` name extensions and attaches each label to the matching `namedEnumValues` entry (new optional `description` on the AST `EnumValueNode`). A string enum that only carries `x-enum-descriptions` (no varnames) now produces `namedEnumValues` too, so the descriptions are not lost. `@kubb/plugin-ts` renders them as per-member JSDoc.
