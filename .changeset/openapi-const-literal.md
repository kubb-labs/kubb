---
'@kubb/adapter-oas': patch
---

Stop treating an OpenAPI 3.1 `const` as a named enum.

A `const` is parsed into a single-value enum. The pre-scan no longer records these in `enumNames`, and `enums: 'root'` no longer lifts them to top-level enums, so a reference to a `const` resolves to its plain name and `@kubb/plugin-ts` can render it as an inline literal.
