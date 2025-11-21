---
"@kubb/plugin-zod": patch
---

Add z.lazy() wrapper to all schema references to resolve circular dependency issues

This change ensures that all schema references are wrapped in `z.lazy()`, deferring their evaluation until runtime. This prevents "used before declaration" errors that can occur with circular dependencies, particularly when using `oneOf`/`anyOf` constructs.

For Zod v4, refs inside object property getters skip the z.lazy() wrapper since the getter itself provides lazy evaluation.
