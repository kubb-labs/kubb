---
layout: doc

title: OpenAPI Support Matrix - What Kubb Supports & Known Limitations
description: Comprehensive overview of OpenAPI features supported by Kubb, edge cases, and areas for improvement.
outline: deep
---

# OpenAPI Support Matrix

This document describes what OpenAPI features Kubb supports for TypeScript code generation, known edge cases, and areas that could be improved.

## Supported Features ✅

### Schema Types

| Feature | Status | Notes |
|---------|--------|-------|
| Primitive types (`string`, `number`, `integer`, `boolean`) | ✅ Full | |
| `object` with `properties` | ✅ Full | Required/optional via `required` array |
| `array` with `items` | ✅ Full | Both `Array<T>` and `T[]` styles configurable |
| `enum` (string, number) | ✅ Full | Multiple output styles: `asConst`, `asPascalConst`, `enum`, `constEnum`, `literal` |
| `$ref` to component schemas | ✅ Full | Resolved to proper type imports |
| `nullable` (OAS 3.0) | ✅ Full | Generates `T \| null` |
| `type: ['string', 'null']` (OAS 3.1) | ✅ Full | Normalized to same output as OAS 3.0 nullable |
| `allOf` (intersection / inheritance) | ✅ Full | Single-member allOf flattened; multi-member creates `&` intersection |
| `oneOf` / `anyOf` (unions) | ✅ Full | Generates `A \| B \| C` union types |
| `discriminator` with `mapping` | ✅ Full | Supports parent→child circular references |
| `additionalProperties` | ✅ Full | `true` → `[key: string]: unknown`; schema → typed index signature |
| `pattern`, `minLength`, `maxLength` | ✅ JSDoc | Added as JSDoc `@pattern`, `@minLength`, `@maxLength` comments |
| `default` values | ✅ JSDoc | Added as `@default` JSDoc comment |
| `deprecated` | ✅ JSDoc | Added as `@deprecated` JSDoc comment |
| `description` | ✅ JSDoc | Added as `@description` JSDoc comment |
| `readOnly` / `writeOnly` | ✅ Full | `readonly` modifier on properties |
| `format: date` / `date-time` / `time` | ✅ Full | Configurable: `string` or `Date` representation |
| `format: uuid`, `email`, `uri` | ✅ Full | Maps to `string` |
| `format: binary` / `byte` | ✅ Full | Maps to `Blob` |
| Recursive schemas (via `$ref`) | ✅ Full | Self-referencing types work through `$ref` indirection |
| `tuple` (prefixItems) | ✅ Full | Fixed-length typed arrays |
| `const` values | ✅ Full | Literal type narrowing |

### Operations

| Feature | Status | Notes |
|---------|--------|-------|
| Path parameters | ✅ Full | Extracted from `{param}` patterns |
| Query parameters | ✅ Full | Optional/required respected |
| Header parameters | ✅ Full | |
| Request body (`application/json`) | ✅ Full | |
| Multiple response status codes | ✅ Full | Per-status types + union response type |
| `operationId` as type name basis | ✅ Full | PascalCase conversion applied |
| Tag-based grouping | ✅ Full | Groups into `{tag}Controller/` directories |
| Legacy naming mode | ✅ Full | `legacy: true` for backward-compatible naming |
| Parameter casing transform | ✅ Full | `paramsCasing: 'camelcase'` option |

### External References

| Feature | Status | Notes |
|---------|--------|-------|
| `$ref` to local schemas | ✅ Full | `#/components/schemas/Foo` |
| `$ref` to external files | ⚠️ Partial | Works for most cases; see [Known Limitations](#external-ref-edge-cases) |
| Remote URL schemas | ✅ Full | Supports `https://` spec URLs |

### Enum Styles

Kubb supports multiple enum output styles via the `enumType` option:

```typescript [kubb.config.ts]
pluginTs({
  enumType: 'asConst', // recommended
})
```

| Style | Output | Type Reference |
|-------|--------|---------------|
| `asConst` | `export const status = { ... } as const` | `StatusKey` + `Status` alias |
| `asPascalConst` | `export const Status = { ... } as const` | `StatusKey` + `Status` alias |
| `enum` | `export enum Status { ... }` | `Status` |
| `constEnum` | `export const enum Status { ... }` | `Status` |
| `literal` | `export type Status = 'a' \| 'b'` | `Status` |
| `inlineLiteral` | Inline `'a' \| 'b'` at usage site | No separate type |

## Known Limitations & Edge Cases

### Naming Collisions

When an operation's generated response type name matches a component schema name, both will be generated but may conflict:

```yaml
# This can cause a collision:
paths:
  /tests:
    post:
      operationId: createTest  # generates CreateTestResponse
components:
  schemas:
    CreateTestResponse:  # same name as the generated response type!
      type: object
```

**Workaround:** Enable `collisionDetection` in the adapter options, or rename the schema to avoid the collision.

**Improvement opportunity:** Detect and warn about operation→schema naming collisions automatically.

### Tags with Spaces

Tags containing spaces (e.g., Figma API's `"Activity Logs"`, `"Component Sets"`) are converted to camelCase directory names. The conversion is implicit:

- `"Activity Logs"` → `activityLogsController/`
- `"Component Sets"` → `componentSetsController/`

This works for most cases but the barrel index file may generate import paths that contain spaces on some systems.

**Improvement opportunity:** Add explicit space sanitization in tag-to-path conversion.

### Operations Without Tags

Operations that omit the `tags` array fall back to a `"default"` group:

```yaml
paths:
  /config:
    get:
      operationId: getConfig
      # no tags array!
```

When using `group: { type: 'tag' }`, this operation will be placed in `defaultController/`.

::: tip
Custom tag extensions (like Box API's `x-box-tag`) are NOT automatically used as fallback tags. Only the standard `tags` array is supported.
:::

### Dot in operationId

OperationIds containing version-like dots are handled correctly:

```yaml
operationId: get_config_v2025.0
# Generates: GetConfigV20250 (dot removed, digits preserved)
```

Dots followed by letters ARE treated as path separators in file mode (e.g., `pet.petId` → `pet/PetId`), but dots followed by digits are NOT split (e.g., `v2025.0` → `V20250`).

### Barrel File Duplicate Exports {#barrel-duplicates}

Large schemas with many operations sharing similar names can produce duplicate exports in barrel index files (TS2300 errors). This is most common with:

- APIs that have many controllers with overlapping operation names
- Schemas that generate both type-only and value exports with the same name

**Improvement opportunity:** Improve deduplication logic in barrel file generation to handle edge cases with mixed `isTypeOnly` flags.

### External `$ref` Edge Cases {#external-ref-edge-cases}

When path operations and component schemas both reference the same external file via `$ref`, the import name resolution can generate incorrect "phantom" imports:

```yaml
# main.yaml
paths:
  /me:
    $ref: './paths/me.yaml'
components:
  schemas:
    AppState:
      properties:
        currentUser:
          $ref: './components/schemas/User.yaml'
```

In some cases, the generated import derives the type name from the path segment rather than the schema file name.

**Status:** Regression test exists (`tests/3.0.x` issue2696). Active improvement area.

### `additionalProperties` with Named Properties

When an object has both named properties and `additionalProperties`, the index signature uses `unknown` as the key type for compatibility:

```typescript
// Generated output:
type Config = {
  name: string           // named property
  [key: string]: unknown // additionalProperties — value type is unknown
}
```

**Improvement opportunity:** Use the `additionalProperties` schema type for the index signature value when named properties are also present.

### Discriminator Without `mapping`

When a discriminator specifies only `propertyName` without an explicit `mapping`, Kubb infers the mapping from `oneOf`/`anyOf` members. This works for most cases but may not cover all patterns.

### `oneOf`/`anyOf` Without Discriminator

These generate plain TypeScript unions without type narrowing helpers:

```typescript
// Without discriminator — plain union, no narrowing
type Response = Cat | Dog | Bird
```

**Improvement opportunity:** Automatically infer discriminator from common property patterns, or generate type guards.

## E2E Validated Schemas

The following OpenAPI schemas are tested end-to-end with full TypeScript type checking:

| Schema | Type | Features Tested |
|--------|------|-----------------|
| `train-travel` | OAS 3.0 | Operations, parameters, responses, Problem type |
| `discriminator` | OAS 3.0 | `oneOf`/`anyOf`/`allOf` with discriminator mapping |
| `Figma` | OAS 3.0 | Large remote schema, tags with spaces, complex types |
| `optionalParameters` | OAS 3.0 | Optional query/path parameters |
| `allOf` | OAS 3.0 | `allOf` composition, single-`$ref` flatten, nullable |
| `anyOf` | OAS 3.0 | `anyOf` union types |
| `petStoreContent` | OAS 3.0 | Content negotiation, full CRUD operations |
| `twitter` | OAS 3.0 | Circular discriminator, 19 Problem subtypes |
| `jokesOne` | OAS 3.0 | Simple API with minimal schemas |
| `readme.io` | OAS 3.0 | Large schema (35+ types) |
| `worldtime` | OAS 3.0 | DateTime types |
| `zalando` | Swagger 2.0 | Legacy Swagger format support |
| `requestBody` | OAS 3.0 | Request body handling, special chars in properties |
| `box` | OAS 3.0 | No-tag operations, dot-in-operationId (v2025.0) |
| `enums` | OAS 3.0 | `asConst` enum style, enum references |
| `dataset_api` | OAS 3.1 | OpenAPI 3.1 features, validation errors |
| `petStoreV3` | OAS 3.0 | Remote URL, full pet store with all operations |

## Disabled Schemas (Known Issues)

| Schema | Issue | Error |
|--------|-------|-------|
| `bunq.com` | Duplicate barrel exports | TS2300: Duplicate identifier in hook index files |
| `atlassian.com` | Blocked by bunq.com | Generation stops on first typecheck failure |
