---
"@kubb/plugin-zod": minor
---

Add support for Zod Mini with the new `mini` option

- Added `mini` option to enable Zod Mini's functional API for better tree-shaking
- When `mini: true`, generates functional syntax (e.g., `z.optional(z.string())`) instead of chainable methods
- Automatically sets `version` to `'4'` and `importPath` to `'zod/mini'` when mini mode is enabled
- Updated parser to support `.check()` syntax for constraints in mini mode (e.g., `z.string().check(z.minLength(5))`)
