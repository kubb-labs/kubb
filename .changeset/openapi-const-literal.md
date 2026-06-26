---
'@kubb/adapter-oas': patch
---

Stop registering an OpenAPI 3.1 `const` schema as a named enum.

A `const` is parsed into a single-value enum node, which `@kubb/plugin-ts` now renders as a literal type rather than a named enum. The pre-scan no longer adds single-value enums to `enumNames`, and `enums: 'root'` no longer promotes them to top-level enum types, so references to a const resolve to its plain name and stay inline literals.
