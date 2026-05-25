---
'@kubb/adapter-oas': patch
---

Treat an enum whose only value is `null` (drf-spectacular's `NullEnum`, `{ enum: [null] }`) as a `null` schema instead of an empty enum.

Previously the `null` value was stripped, leaving an enum with no values that rendered as `never` (`@kubb/plugin-ts`) or an invalid `z.enum([])` (`@kubb/plugin-zod`), silently dropping nullability. The common drf-spectacular `oneOf: [StatusEnum, BlankEnum, NullEnum]` pattern now generates valid output (e.g. `Status | "" | null`).
