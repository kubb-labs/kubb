---
"@kubb/adapter-oas": patch
---

- `parseSchema` now propagates the parent name through every call site that previously dropped it: array items (`convertArray`), `allOf` members (single, multi, and synthetic required-key + outer-properties), `oneOf` / `anyOf` member schemas, union members, operation responses (`{operationId}Status{statusCode}`), request bodies (`{operationId}Request`), and parameters (`{operationId}{ParamName}`).
- Operation response schemas now use `Status<code>` (matching plugin-ts's `resolveResponseStatusName` convention) so qualified enum names don't collide with top-level component schemas named `<operation><statusCode>` (e.g. `GetMaintenance200`).
- Two test expectations updated to reflect the new contracts:
  - Parameter top-level enums now carry a parser-level name (qualified with operation + param name) so plugin-generated downstream identifiers stay collision-free.
  - The synthetic injected-required-key member inside an `allOf` is now named so its nested enums qualify correctly. It consequently shows up as a separate intersection member instead of being adjacent-merged.

