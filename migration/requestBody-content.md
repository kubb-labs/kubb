# Migration: `OperationNode.requestBody` restructured

This guide covers the breaking change to `OperationNode.requestBody` introduced to support operations that accept multiple request body content types (for example, both `application/json` and `multipart/form-data` on the same endpoint).

## What changed

The top-level `schema`, `keysToOmit`, and `contentType` fields have been removed from `requestBody`. All per-content-type data now lives inside the `content` array, with one entry per content type declared in the spec.

**Before**

```ts
type OperationNode = {
  requestBody?: {
    description?: string
    required?: boolean
    contentType?: string        // removed
    schema?: SchemaNode         // removed
    keysToOmit?: Array<string>  // removed
  }
}
```

**After**

```ts
type OperationNode = {
  requestBody?: {
    description?: string
    required?: boolean
    content?: Array<{
      contentType: string
      schema?: SchemaNode
      keysToOmit?: Array<string>
    }>
  }
}
```

## How `content` is populated

| Situation | `content` entries |
|---|---|
| `contentType` adapter option is set | One entry for the selected content type only |
| `contentType` is not set, one content type in the spec | One entry |
| `contentType` is not set, multiple content types in the spec | One entry per content type |

## How to migrate plugin code

Replace every access to the removed top-level fields with the equivalent lookup on `content[0]` for the primary content type, or iterate over all entries to handle every content type.

### `requestBody.schema`

```ts
// Before
const schema = operation.requestBody?.schema

// After
const schema = operation.requestBody?.content?.[0]?.schema
```

### `requestBody.contentType`

```ts
// Before
const contentType = operation.requestBody?.contentType

// After
const contentType = operation.requestBody?.content?.[0]?.contentType
```

### `requestBody.keysToOmit`

```ts
// Before
const keysToOmit = operation.requestBody?.keysToOmit

// After
const keysToOmit = operation.requestBody?.content?.[0]?.keysToOmit
```

## Generating per-content-type artifacts

The new `content` array makes it straightforward to generate separate client functions or hooks for each content type variant of an endpoint.

```ts
// Generate one hook per content type
for (const entry of operation.requestBody?.content ?? []) {
  const suffix = entry.contentType === 'multipart/form-data' ? 'Multipart' : ''
  const hookName = `use${pascalCase(operation.operationId)}${suffix}`

  // entry.contentType  → 'application/json' | 'multipart/form-data'
  // entry.schema       → type-specific schema node
  // entry.keysToOmit   → readOnly fields to omit
}
```

This produces hooks such as `useCreatePath` (JSON) and `useCreatePathMultipart` (multipart/form-data) from a single operation with two content types.

## Adapter `contentType` option

The `adapterOas({ contentType: '...' })` option continues to work as before. When set, `requestBody.content` contains exactly one entry for the configured content type, so existing code that reads `content[0]` behaves identically to the old single-schema behavior.

```ts
// kubb.config.ts — fix to a single content type (unchanged behavior)
adapterOas({ contentType: 'application/json' })
```
