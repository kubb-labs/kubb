---
'@kubb/core': minor
'@kubb/plugin-ts': minor
---

Add `enumKeyCasing` option to control enum key name casing

Generated enums now support configurable key casing through the new `enumKeyCasing` option in `@kubb/plugin-ts`. This allows transforming enum keys into conventional casing formats instead of using raw values.

**New transformers in @kubb/core:**
- `screamingSnakeCase`: Converts to SCREAMING_SNAKE_CASE
- `snakeCase`: Converts to snake_case

**New option in @kubb/plugin-ts:**
- `enumKeyCasing`: Choose from `'screamingSnakeCase'` | `'snakeCase'` | `'pascalCase'` | `'camelCase'` | `'none'` (default: `'none'`)

**Example:**

```typescript
// kubb.config.ts
export default {
  plugins: [
    pluginTs({
      enumKeyCasing: 'screamingSnakeCase',
    }),
  ],
}
```

Before:
```typescript
export const enumStringEnum = {
  'created at': 'created at',
  'FILE.UPLOADED': 'FILE.UPLOADED',
} as const
```

After:
```typescript
export const enumStringEnum = {
  CREATED_AT: 'created at',
  FILE_UPLOADED: 'FILE.UPLOADED',
} as const
```

**Additional improvements:**
- Enum member keys now use identifiers without quotes when the key is a valid JavaScript identifier, making the output cleaner and more idiomatic
- Default value is `'none'` to preserve backward compatibility
