---
name: jsdoc
description: Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
---

# JSDoc Skill

This skill provides focused guidelines for writing JSDoc comments consistently across the codebase.

## When to Use

- Documenting exported type properties and configuration options
- Adding context that TypeScript types don't convey on their own
- Providing usage examples for non-obvious or multi-variant APIs
- Writing inline documentation for generated docs

## What It Does

- Defines `@example` format conventions (label + inline backtick or fenced block)
- Ensures every exported type and property has meaningful documentation
- Avoids redundant tags that duplicate TypeScript type information
- Ensures consistent documentation style across all packages

---

## `@example` Format

### Short one-liner — label on the `@example` line, code as inline backtick on the next line

```typescript
/**
 * @example Required parameter
 * `name: Type`
 *
 * @example Optional parameter
 * `name?: Type`
 */
```

### Multi-line — fenced code block immediately after `@example`

````typescript
/**
 * @example
 * ```ts
 * const result = buildParams(node, {
 *   paramsType: 'inline',
 * })
 * ```
 */
````

### Multiple variants — use multiple `@example` blocks

```typescript
/**
 * @example Object mode
 * `{ id, data, params }: { id: string; data: Data; params?: QueryParams }`
 *
 * @example Inline mode
 * `id: string, data: Data, params?: QueryParams`
 */
```

### Rules

| Rule                    | ✅ Correct                          | ❌ Incorrect                                 |
| ----------------------- | ----------------------------------- | -------------------------------------------- |
| Label + inline code     | `@example Required\n\`name: Type\`` | `@example \`name: Type\`` (code on tag line) |
| Multi-line code         | Fenced ` ```ts ``` ` block          | Bare code lines without a fence              |
| Short examples          | Inline backtick                     | Triple-backtick fence (too heavy)            |
| One concern per example | Separate `@example` blocks          | One example covering all cases               |

---

## Tags

### Use Frequently

| Tag           | Purpose            | Notes                                                  |
| ------------- | ------------------ | ------------------------------------------------------ |
| `@default`    | Default value      | Only when default is non-obvious; omit for `undefined` |
| `@example`    | Usage example      | Prefer for complex or multi-variant APIs               |
| `@note`       | Important caveat   | Version info, breaking changes                         |
| `@deprecated` | Mark as deprecated | Include migration path                                 |

### Use Sparingly

| Tag         | Purpose                 |
| ----------- | ----------------------- |
| `@see`      | Reference external docs |
| `@internal` | Internal API            |
| `@beta`     | Experimental            |

### Avoid (TypeScript Provides)

- ❌ `@param` — use TypeScript parameter types
- ❌ `@returns` — use TypeScript return type
- ❌ `@type` — use TypeScript type annotation
- ❌ `@typedef` — use `type` or `interface`
- ❌ `@default undefined` — optional (`?`) already implies this

---

## Documentation Patterns

### Simple property — always multi-line

```typescript
/**
 * Output directory for generated files.
 */
outDir?: string
```

> ❌ Never use single-line `/** description */` — always expand to multi-line.

### Property with non-obvious default

```typescript
/**
 * Maximum number of concurrent callbacks during traversal.
 * Higher values overlap I/O-bound work; lower values reduce memory pressure.
 *
 * @default 30
 */
concurrency?: number
```

> Do **not** add `@default false` or `@default undefined` when the TypeScript type already makes the default obvious.

### Enum / union with options

```typescript
/**
 * How path parameters are emitted in the function signature.
 * - `'object'` groups them as a single destructured parameter
 * - `'inline'` spreads them as individual parameters
 * - `'inlineSpread'` emits a single rest parameter
 */
pathParamsType: "object" | "inline" | "inlineSpread";
```

### Property with example

```typescript
/**
 * Applies a uniform transformation to every resolved type string.
 * Use this for framework-level type wrappers.
 *
 * @example Wrap every type in a reactive container
 * `typeWrapper: (t) => \`Reactive<${t}>\``
 */
typeWrapper?: (type: string) => string
```

### Nested properties — every field gets its own multi-line JSDoc

```typescript
names?: {
  /**
   * Name for the request body parameter.
   * @default 'data'
   */
  data?: string
  /**
   * Name for the query parameters group parameter.
   * @default 'params'
   */
  params?: string
  /**
   * Name for the header parameters group parameter.
   * @default 'headers'
   */
  headers?: string
}
```

### Function documentation

Only add JSDoc when it adds value beyond the signature:

```typescript
// ✅ No JSDoc needed — signature is self-explanatory
function camelCase(str: string): string { ... }

// ✅ JSDoc adds value — explains behaviour and non-obvious edge cases
/**
 * Returns `true` when the schema resolves to a plain string output.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'`.
 *
 * @example UUID resolves to a plain string
 * `isStringType(uuidSchema) // true`
 *
 * @example Date with date representation is not a plain string
 * `isStringType(dateSchema) // false`
 */
function isStringType(node: SchemaNode): boolean { ... }
```

---

## Guidelines

**✅ DO:**

- Document **what** the property does, not its TypeScript type
- Give every exported type, property, and function a JSDoc comment
- Always use multi-line JSDoc blocks — never single-line `/** ... */`
- Use concrete, full-sentence descriptions — not "Enum schema." or "Boolean value."
- Include `@default` only when the default is non-obvious (not `undefined`, not `false`)
- Use multiple `@example` blocks to show different variants or modes
- Keep `@example` labels short and descriptive

**❌ DON'T:**

- Write single-line `/** description */` — always use multi-line
- Write `@default undefined` — optional `?` already implies this
- Put code directly on the `@example` line: `@example \`foo: string\`` → move code to next line
- Use `@param` or `@returns` tags
- Over-document trivial, self-explanatory properties

---

## Tag Order

For consistency, use this order within a JSDoc block:

1. Description (required)
2. Bullet-list of variants or behaviours (if applicable)
3. `@default` (if non-obvious)
4. `@example` (one or more)
5. `@note` (if needed)
6. `@deprecated` (if applicable)
7. `@see` (if providing references)

---

## Related Skills

| Skill                                                      | Use For                              |
| ---------------------------------------------------------- | ------------------------------------ |
| **[../documentation/SKILL.md](../documentation/SKILL.md)** | Writing markdown documentation files |
| **[../coding-style/SKILL.md](../coding-style/SKILL.md)**   | General coding conventions           |
