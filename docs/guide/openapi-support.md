---
layout: doc

title: OpenAPI Support
description: What Kubb supports across Swagger 2.0, OpenAPI 3.0, 3.1, and 3.2 — features, schema types, operations, and known limitations.
outline: deep
---

# OpenAPI Support

Kubb reads your OpenAPI (formerly Swagger) specification and generates TypeScript types, API clients, hooks, mocks, and validators.

## Version Support

| Version     | Status          | Notes                                              |
| ----------- | --------------- | -------------------------------------------------- |
| Swagger 2.0 | ✅ Supported    | Legacy format via `oas` parser                     |
| OpenAPI 3.0 | ✅ Supported    | Full feature support                               |
| OpenAPI 3.1 | ✅ Supported    | `type: ['string', 'null']`, `const`, `prefixItems` |
| OpenAPI 3.2 | ⚠️ Experimental | Parsed as 3.1; features may vary                   |

## Schema Types

| Feature                                                    | Status   | Notes                                                    |
| ---------------------------------------------------------- | -------- | -------------------------------------------------------- |
| Primitive types (`string`, `number`, `integer`, `boolean`) | ✅       |                                                          |
| `object` with `properties`                                 | ✅       | Required/optional via `required` array                   |
| `array` with `items`                                       | ✅       |                                                          |
| `enum` (string, number)                                    | ✅       | Multiple output styles — see [Enum Styles](#enum-styles) |
| `$ref` to component schemas                                | ✅       | Resolved to proper type imports                          |
| `nullable` (OAS 3.0)                                       | ✅       | Generates `T \| null`                                    |
| `type: ['string', 'null']` (OAS 3.1)                       | ✅       | Normalized to same output as nullable                    |
| `allOf` (intersection / inheritance)                       | ✅       | Single-member flattened; multi-member creates `&`        |
| `oneOf` / `anyOf` (unions)                                 | ✅       | Generates `A \| B \| C` union types                      |
| `discriminator` with `mapping`                             | ✅       | Supports parent→child circular references                |
| `additionalProperties`                                     | ✅       | `true` → `[key: string]: unknown`; schema → typed index  |
| `const` values                                             | ✅       | Literal type narrowing                                   |
| `tuple` (`prefixItems`)                                    | ✅       | Fixed-length typed arrays                                |
| Recursive schemas (via `$ref`)                             | ✅       | Self-referencing types via `$ref` indirection            |
| `readOnly` / `writeOnly`                                   | ✅       | `readonly` modifier on properties                        |
| `format: date` / `date-time` / `time`                      | ✅       | Configurable: `string` or `Date`                         |
| `format: uuid`, `email`, `uri`                             | ✅       | Maps to `string`                                         |
| `format: binary` / `byte`                                  | ✅       | Maps to `Blob`                                           |
| `pattern`, `minLength`, `maxLength`                        | ✅ JSDoc | Added as `@pattern`, `@minLength`, `@maxLength`          |
| `default` values                                           | ✅ JSDoc | Added as `@default` comment                              |
| `deprecated`                                               | ✅ JSDoc | Added as `@deprecated` comment                           |
| `description`                                              | ✅ JSDoc | Added as `@description` comment                          |

## Operations

| Feature                           | Status     | Notes                                                                   |
| --------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Path parameters                   | ✅         | Extracted from `{param}` patterns                                       |
| Query parameters                  | ✅         | Optional/required respected                                             |
| Header parameters                 | ✅         |                                                                         |
| Request body (`application/json`) | ✅         |                                                                         |
| Multiple response status codes    | ✅         | Per-status types + union response type                                  |
| `operationId` as type name basis  | ✅         | PascalCase conversion applied                                           |
| Tag-based grouping                | ✅         | Groups into `{tag}Controller/` directories                              |
| Legacy naming mode                | ✅         | `compatibilityPreset: 'kubbV4'` for backward-compatible naming          |
| Parameter casing transform        | ✅         | `paramsCasing: 'camelcase'` option                                      |
| `$ref` to local schemas           | ✅         | `#/components/schemas/Foo`                                              |
| `$ref` to external files          | ⚠️ Partial | Works for most cases; see [Known Limitations](#external-ref-edge-cases) |
| Remote URL schemas (`https://`)   | ✅         |                                                                         |

## Enum Styles

Configure the enum output style via the `enumType` option in `pluginTs`:

```typescript [kubb.config.ts]
pluginTs({
  enumType: 'asConst', // recommended
})
```

| Style           | Output                                   | Notes                        |
| --------------- | ---------------------------------------- | ---------------------------- |
| `asConst`       | `export const status = { ... } as const` | Recommended — tree-shakeable |
| `asPascalConst` | `export const Status = { ... } as const` | PascalCase variant           |
| `enum`          | `export enum Status { ... }`             | TypeScript enum              |
| `constEnum`     | `export const enum Status { ... }`       | Inlined by the compiler      |
| `literal`       | `export type Status = 'a' \| 'b'`        | Type alias                   |
| `inlineLiteral` | `'a' \| 'b'` at usage site               | No separate declaration      |

## Discriminators

Discriminators are used for polymorphic schemas (`oneOf` / `anyOf`). Kubb supports both explicit and inferred mappings.

### Supported Patterns

| Pattern                                               | Status             |
| ----------------------------------------------------- | ------------------ |
| Explicit `mapping`                                    | ✅                 |
| Inferred mapping (from schema names)                  | ✅                 |
| With `oneOf` / `anyOf`                                | ✅                 |
| Inline schemas (not just `$ref`)                      | ✅                 |
| `const` / single-value enum on discriminator property | ✅                 |
| Extension properties (`x-*`) as discriminator         | ✅ (metadata only) |
| Circular parent→child references                      | ✅                 |

### Modes

Configure via `pluginOas({ discriminator: ... })`:

| Mode               | Behavior                                                    |
| ------------------ | ----------------------------------------------------------- |
| `strict` (default) | Discriminator property not added to child schemas           |
| `inherit`          | Discriminator property with enum values added to each child |

### Example

```yaml
components:
  schemas:
    Pet:
      discriminator:
        propertyName: petType
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
```

## Parameter Serialization

Kubb handles the `style` and `explode` properties for query parameters per the OpenAPI spec.

### `style: form` + `explode: true` (default)

Object properties are flattened into separate query params:

```yaml
parameters:
  - name: filters
    in: query
    style: form
    explode: true
    schema:
      type: object
      additionalProperties:
        type: string
```

```typescript
// Generated type
type QueryParams = { [key: string]: string }
```

### `style: form` + `explode: false`

Object remains nested under the parameter name:

```typescript
type QueryParams = {
  filters?: { [key: string]: string }
}
```

## Known Limitations

### Naming Collisions {#naming-collisions}

If an operation's generated response type name matches a component schema name, both are generated and may conflict (TS2300).

**Workaround:** Enable `collisionDetection` in the adapter options, or rename the conflicting schema.

### Tags with Spaces

Tags with spaces (e.g. `"Activity Logs"`) are converted to camelCase directory names implicitly. Barrel index files may produce incorrect import paths on some systems.

### Operations Without Tags

Operations without a `tags` array fall back to a `default` group and are placed in `defaultController/` when using `group: { type: 'tag' }`.

::: tip
Custom tag extensions (e.g. `x-box-tag`) are not used as fallback tags — only the standard `tags` array is supported.
:::

### Dot in `operationId`

Dots followed by letters are treated as path separators (`pet.petId` → `pet/PetId`). Dots followed by digits are preserved (`v2025.0` → `V20250`).

### Barrel File Duplicate Exports {#barrel-duplicates}

Large schemas with overlapping operation names can produce duplicate exports in barrel index files (TS2300). Most common with many controllers sharing similar names.

### External `$ref` Edge Cases {#external-ref-edge-cases}

When path operations and component schemas both `$ref` the same external file, the import name resolution can generate incorrect phantom imports. A regression test exists (`tests/3.0.x` issue2696).

### `additionalProperties` with Named Properties

When an object has both named properties and `additionalProperties`, the index signature value type falls back to `unknown`:

```typescript
type Config = {
  name: string
  [key: string]: unknown // additionalProperties typed as unknown
}
```

### `oneOf`/`anyOf` Without Discriminator

These generate plain TypeScript unions without type narrowing helpers:

```typescript
type Response = Cat | Dog | Bird
```

## Validated Schemas

The following schemas are tested end-to-end with full TypeScript type checking:

| Schema               | Spec Version | Features Tested                                    |
| -------------------- | ------------ | -------------------------------------------------- |
| `train-travel`       | OAS 3.0      | Operations, parameters, responses                  |
| `discriminator`      | OAS 3.0      | `oneOf`/`anyOf`/`allOf` with discriminator mapping |
| `Figma`              | OAS 3.0      | Large remote schema, tags with spaces              |
| `optionalParameters` | OAS 3.0      | Optional query/path parameters                     |
| `allOf`              | OAS 3.0      | Composition, single-`$ref` flatten, nullable       |
| `anyOf`              | OAS 3.0      | Union types                                        |
| `petStoreContent`    | OAS 3.0      | Content negotiation, full CRUD                     |
| `twitter`            | OAS 3.0      | Circular discriminator, 19 Problem subtypes        |
| `jokesOne`           | OAS 3.0      | Simple API                                         |
| `readme.io`          | OAS 3.0      | Large schema (35+ types)                           |
| `worldtime`          | OAS 3.0      | DateTime types                                     |
| `zalando`            | Swagger 2.0  | Legacy Swagger format                              |
| `requestBody`        | OAS 3.0      | Request body, special chars in properties          |
| `box`                | OAS 3.0      | No-tag operations, dot-in-operationId              |
| `enums`              | OAS 3.0      | `asConst` enum style, enum references              |
| `dataset_api`        | OAS 3.1      | OpenAPI 3.1 features, validation errors            |
| `atlassian.com`      | OAS 3.0      | Large real-world API (Jira platform)               |
| `petStoreV3`         | OAS 3.0      | Remote URL, full pet store operations              |
