---
"@kubb/plugin-oas": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-faker": minor
---

Refactor parsers to use shared `createParser` helper

Introduces `createParser` helper in `@kubb/plugin-oas` to eliminate parser duplication across Zod, TypeScript, and Faker plugins. Each parser previously reimplemented ~300 lines of schema traversal logic.

**New Features:**
- New `createParser` API in `@kubb/plugin-oas` that accepts keyword mapper + custom handlers
- Exports `findSchemaKeyword` utility for constraint lookup in sibling schemas
- Handlers can use `this.parse` for recursive parsing (enabled via Function.call())
- Improved type names: `Schema` → `SchemaKeywordNode`, `SchemaTree` → `ParseContext`

**Parser Changes:**
- `@kubb/plugin-zod`: Converted to use handlers for mini-mode, object getters, coercion
- `@kubb/plugin-ts`: Converted to use handlers for JSDoc generation, AST node construction
- `@kubb/plugin-faker`: Converted to use handlers for dynamic type generation

**Breaking Changes:**
- Type renames in `@kubb/plugin-oas`:
  - `Schema` is now `SchemaKeywordNode` (represents parsed keyword nodes)
  - `SchemaTree` is now `ParseContext` (represents parsing context with tree state)

All existing tests pass. No functional changes to generated code.
