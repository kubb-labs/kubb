---
name: jsdoc
description: Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
---

# JSDoc Skill

This skill provides simple, focused guidelines for writing JSDoc comments in TypeScript codebases.

## When to Use

- Documenting type properties and configuration options
- Adding context that TypeScript types don't convey
- Providing usage examples for complex APIs
- Writing inline documentation for generated docs

## What It Does

- Defines simple JSDoc conventions for TypeScript
- Focuses on property-level documentation with inline comments
- Uses minimal tags for maximum clarity (`@default`, `@example`, `@note`)
- Avoids redundant tags that duplicate TypeScript type information
- Ensures consistent documentation style across the codebase

## How to Use

Write inline JSDoc comments directly above properties, focusing on what the option does rather than repeating type information.

### Basic Structure

```typescript
export type Options = {
  /**
   * Brief description of what this property does.
   * @default 'defaultValue'
   */
  propertyName?: string
}
```

## Common Tags

### Use Frequently

| Tag | Purpose | Example |
| --- | ------- | ------- |
| `@default` | Default value | `@default 'dist'` |
| `@example` | Usage example | `@example serverIndex: 0` |
| `@note` | Important caveat | `@note May change in v2` |
| `@deprecated` | Mark as deprecated | `@deprecated Use newOption instead` |

### Use Sparingly

| Tag | Purpose | Example |
| --- | ------- | ------- |
| `@see` | Reference docs | `@see https://example.com/docs` |
| `@internal` | Internal API | `@internal` |
| `@beta` | Experimental | `@beta` |

### Avoid (TypeScript Provides)

- ❌ `@param` - Use TypeScript parameters
- ❌ `@returns` - Use TypeScript return type
- ❌ `@type` - Use TypeScript type annotation
- ❌ `@typedef` - Use `type` or `interface`

## Documentation Patterns

### Simple Property

```typescript
/** Output directory for generated files. */
outDir?: string
```

### Property with Default

```typescript
/**
 * Set a suffix for generated files.
 * @default 'generated'
 */
suffix?: string
```

### Enum with Options

```typescript
/**
 * Choose output format.
 * - 'type' generates type aliases
 * - 'interface' generates interfaces
 * @default 'type'
 */
format?: 'type' | 'interface'
```

### Property with Example

```typescript
/**
 * Server index to use.
 * @example
 * - `0` returns production URL
 * - `1` returns development URL
 */
serverIndex?: number
```

### Nested Properties

```typescript
transformers?: {
  /** Customize file names. */
  name?: (name: string) => string
  /** Customize output paths. */
  path?: (path: string) => string
}
```

### Function Documentation

Only add JSDoc when it adds value beyond the signature:

```typescript
// ✅ No JSDoc needed - signature is clear
function camelCase(str: string): string {
  return str.replace(/-./g, x => x[1].toUpperCase())
}

// ✅ JSDoc adds value - explains behavior
/**
 * Convert path to template string.
 * @example /api/{id} => `/api/${id}`
 */
function toTemplate(path: string): string {
  // implementation
}
```

## Guidelines

**✅ DO:**
- Document **what** the property does, not the type
- Include `@default` for default values
- Add `@example` for complex or non-obvious usage
- Use `@note` for version info or important caveats
- Keep descriptions concise and focused

**❌ DON'T:**
- Use `@param` or `@returns` tags
- Repeat information from TypeScript types
- Over-document simple, self-explanatory properties
- Write redundant descriptions

## Tag Order

For consistency, use this tag order:

1. Description (required)
2. `@default` (if applicable)
3. `@example` (if helpful)
4. `@note` (if needed)
5. `@deprecated` (if applicable)
6. `@see` (if providing references)

## Related Skills

| Skill | Use For |
| ----- | ------- |
| **[../documentation/SKILL.md](../documentation/SKILL.md)** | Writing markdown documentation files |
| **[../coding-style/SKILL.md](../coding-style/SKILL.md)** | General coding conventions |
