---
'@kubb/adapter-oas': minor
'@kubb/ast': patch
---

Read enum member descriptions from the `x-enumDescriptions` and `x-enum-descriptions` vendor extensions.

`adapter-oas` already mapped the `x-enumNames` / `x-enum-varnames` names into `namedEnumValues`. It now reads the matching description extensions too, attaching each label to its `namedEnumValues` entry through a new optional `description` on the AST `EnumValueNode`. An enum that carries only `x-enum-descriptions` (no varnames) now produces `namedEnumValues` as well, so those labels survive instead of being dropped. `@kubb/plugin-ts` renders them as per-member JSDoc.
