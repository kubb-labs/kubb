# OpenAPI v3.0 and v3.1 Feature Support in Kubb

This document provides a comprehensive overview of OpenAPI v3.0 and v3.1 feature support in Kubb.

## Overview

Kubb provides robust support for OpenAPI v3.0 specifications and partial support for OpenAPI v3.1 specifications. The parsing and schema generation capabilities are primarily handled by:

- **@kubb/oas** - Core OpenAPI parsing, normalization, and utilities
- **@kubb/plugin-oas** - Schema generation and type inference

## Version Detection

Kubb can automatically detect and handle different OpenAPI versions:

```typescript
// From packages/oas/src/utils.ts
function isOpenApiV2Document(doc: any): doc is OpenAPIV2.Document
function isOpenApiV3Document(doc: any): doc is OpenAPIV3.Document  
function isOpenApiV3_1Document(doc: any): doc is OpenAPIV3_1.Document
```

## OpenAPI 3.0 Feature Support

### ✅ Document Structure (Fully Supported)

| Feature | Status | Notes |
|---------|--------|-------|
| `openapi` | ✅ | Version field detection and validation |
| `info` | ✅ | Title, description, version, contact, license |
| `servers` | ✅ | Server URLs and variables |
| `paths` | ✅ | API endpoint definitions |
| `components` | ✅ | Reusable components |
| `tags` | ✅ | Endpoint categorization |
| `externalDocs` | ✅ | External documentation links |
| `security` | ✅ | Global security requirements (via infer) |

### ✅ Path Items (Fully Supported)

| Feature | Status | Notes |
|---------|--------|-------|
| Operations | ✅ | GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, TRACE |
| `parameters` | ✅ | Path, query, header, cookie parameters |
| `requestBody` | ✅ | Request body with content negotiation |
| `responses` | ✅ | Response definitions with status codes |
| `deprecated` | ✅ | Deprecation markers |
| `security` | ✅ | Operation-level security (via infer) |
| `servers` | ✅ | Operation-level server overrides |
| `callbacks` | ❌ | **NOT SUPPORTED** |

### ✅ Schema Object (Mostly Supported)

#### Core Type Validation

| Feature | Status | Implementation |
|---------|--------|----------------|
| `type` | ✅ | All types: string, number, integer, boolean, array, object |
| `format` | ✅ | Standard formats: date-time, email, uuid, uri, etc. |
| `properties` | ✅ | Object property definitions |
| `required` | ✅ | Required property validation |
| `enum` | ✅ | Enumeration values |
| `default` | ✅ | Default values |
| `example` | ✅ | Example values |
| `deprecated` | ✅ | Deprecation markers |

#### Schema Combinators

| Feature | Status | Implementation |
|---------|--------|----------------|
| `allOf` | ✅ | Intersection/merging of schemas |
| `oneOf` | ✅ | Union with exclusive choice |
| `anyOf` | ✅ | Union with non-exclusive choice |
| `not` | ✅ | Negation of schema |

#### Array Validation

| Feature | Status | Implementation |
|---------|--------|----------------|
| `items` | ✅ | Array item schema |
| `minItems` | ✅ | Minimum array length |
| `maxItems` | ✅ | Maximum array length |
| `uniqueItems` | ✅ | Unique array items |

#### String Validation

| Feature | Status | Implementation |
|---------|--------|----------------|
| `minLength` | ✅ | Minimum string length |
| `maxLength` | ✅ | Maximum string length |
| `pattern` | ✅ | Regex pattern matching |

#### Number Validation

| Feature | Status | Implementation |
|---------|--------|----------------|
| `minimum` | ✅ | Minimum value |
| `maximum` | ✅ | Maximum value |
| `exclusiveMinimum` | ✅ | Exclusive minimum (boolean in v3.0) |
| `exclusiveMaximum` | ✅ | Exclusive maximum (boolean in v3.0) |
| `multipleOf` | ✅ | Multiple of value |

#### Object Validation

| Feature | Status | Implementation |
|---------|--------|----------------|
| `minProperties` | ✅ | Minimum number of properties |
| `maxProperties` | ✅ | Maximum number of properties |
| `additionalProperties` | ✅ | Additional property schema |

#### OpenAPI-Specific Schema Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| `nullable` | ✅ | v3.0 nullable property support |
| `discriminator` | ✅ | Polymorphism with discriminator property |
| `readOnly` | ✅ | Read-only property marker |
| `writeOnly` | ✅ | Write-only property marker |
| `xml` | ✅ | XML representation hints |
| `externalDocs` | ✅ | Schema-level external docs |

### ✅ Components (Mostly Supported)

| Feature | Status | Notes |
|---------|--------|-------|
| `schemas` | ✅ | Reusable schema definitions |
| `responses` | ✅ | Reusable response definitions |
| `parameters` | ✅ | Reusable parameter definitions |
| `examples` | ✅ | Reusable example definitions |
| `requestBodies` | ✅ | Reusable request body definitions |
| `headers` | ✅ | Reusable header definitions |
| `securitySchemes` | ✅ | Security scheme definitions (via infer) |
| `links` | ❌ | **NOT SUPPORTED** |
| `callbacks` | ❌ | **NOT SUPPORTED** |

### ✅ Security Schemes (Supported via Infer)

The `@kubb/oas/infer` module provides type-safe security parameter inference:

| Scheme Type | Status | Implementation |
|-------------|--------|----------------|
| `apiKey` (header) | ✅ | `packages/oas/src/infer/security.ts` |
| `apiKey` (query) | ✅ | `packages/oas/src/infer/security.ts` |
| `http` (basic) | ✅ | `packages/oas/src/infer/security.ts` |
| `http` (bearer) | ✅ | `packages/oas/src/infer/security.ts` |
| `oauth2` | ✅ | `packages/oas/src/infer/security.ts` |
| `openIdConnect` | ⚠️ | May be supported, needs verification |

### ✅ References

| Feature | Status | Notes |
|---------|--------|-------|
| `$ref` | ✅ | Local references (#/components/...) |
| External refs | ✅ | Via @redocly/openapi-core bundling |

## OpenAPI 3.1 Feature Support

OpenAPI 3.1 aligns more closely with JSON Schema 2020-12. Kubb has partial support for v3.1 features.

### ✅ Supported v3.1 Features

#### Type System Changes

| Feature | Status | Implementation |
|---------|--------|----------------|
| `type` as array | ✅ | `type: ["string", "null"]` instead of nullable |
| `const` keyword | ✅ | `SchemaGenerator.ts` lines 729-748 |
| `prefixItems` | ✅ | Tuple validation support in `SchemaGenerator.ts` and `Oas.ts` |
| `exclusiveMinimum` as number | ✅ | Changed from boolean to number (lines 593-600) |
| `exclusiveMaximum` as number | ✅ | Changed from boolean to number (lines 593-600) |

#### Version Detection

```typescript
// From packages/oas/src/utils.ts
export function isOpenApiV3_1Document(doc: any): doc is OpenAPIV3_1.Document {
  return doc && isPlainObject<OpenAPIV3_1.Document>(doc) && 
         'openapi' in doc && doc.openapi.startsWith('3.1')
}
```

### ❌ Missing v3.1 Features

#### JSON Schema 2020-12 Features

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| `$defs` | ❌ | High | Should complement `components/schemas` |
| `unevaluatedProperties` | ❌ | Medium | Advanced object validation |
| `unevaluatedItems` | ❌ | Medium | Advanced array validation |
| `minContains` | ❌ | Low | Array contains validation |
| `maxContains` | ❌ | Low | Array contains validation |
| `dependentSchemas` | ❌ | Medium | Conditional schema application |
| `dependentRequired` | ❌ | Medium | Conditional required properties |
| `patternProperties` | ❌ | Medium | Pattern-based property validation |
| `propertyNames` | ❌ | Low | Property name validation |
| `if`/`then`/`else` | ❌ | High | Conditional schema validation |
| `$comment` | ❌ | Low | Schema comments |
| `contentMediaType` | ❌ | Low | Content type hints |
| `contentEncoding` | ❌ | Low | Content encoding hints |
| `contentSchema` | ❌ | Low | Content schema validation |

#### OpenAPI 3.1 Specific Features

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| `webhooks` | ❌ | High | Alternative to paths for webhook definitions |
| `jsonSchemaDialect` | ❌ | Medium | Specify JSON Schema dialect |
| `$schema` in schemas | ❌ | Low | JSON Schema version declaration |
| Multiple `examples` | ⚠️ | Medium | Needs verification (replaces single `example`) |

## Implementation Details

### Schema Generation

The core schema generation logic is in `packages/plugin-oas/src/SchemaGenerator.ts`:

```typescript
// Example of const keyword support (v3.1)
if (version === '3.1' && 'const' in schemaObject) {
  if (schemaObject['const'] === null) {
    return [{ keyword: schemaKeywords.null }]
  }
  if (schemaObject['const'] === undefined) {
    return [{ keyword: schemaKeywords.undefined }]
  }
  
  let format = typeof schemaObject['const']
  if (format !== 'number' && format !== 'boolean') {
    format = 'string'
  }
  
  return [{
    keyword: schemaKeywords.const,
    args: {
      name: schemaObject['const'],
      format: format,
      value: schemaObject['const'],
    },
  }]
}
```

### Discriminator Support

Kubb supports discriminators with two modes:

```typescript
// In packages/oas/src/Oas.ts
type Options = {
  contentType?: contentType
  discriminator?: 'strict' | 'inherit'  // strict: original behavior, inherit: add discriminator to child schemas
}
```

### Type Inference

The `@kubb/oas/infer` module provides advanced type-level inference:

```typescript
import type { Infer, Model, RequestParams, Response } from '@kubb/oas'

const oas = { /* your OpenAPI spec */ } as const

type Oas = Infer<typeof oas>
type Pet = Model<Oas, 'Pet'>
type GetPetParams = RequestParams<Oas, '/pets/{id}', 'get'>
type GetPetResponse = Response<Oas, '/pets/{id}', 'get'>
```

## Recommendations

### High Priority Additions

1. **Webhooks Support** - Critical for v3.1 adoption
   - Add webhook parsing in `packages/oas/src/Oas.ts`
   - Generate webhook types similar to path operations
   - Update plugin-oas to generate webhook handlers

2. **Callbacks Support** - Important for async APIs
   - Parse callback definitions from operations
   - Generate callback handler types
   - Document callback usage patterns

3. **Links Support** - Useful for HATEOAS APIs
   - Parse link definitions from responses
   - Generate link helper types
   - Document link traversal patterns

4. **if/then/else Support** - High value for conditional schemas
   - Implement conditional schema parsing
   - Generate union types for conditional branches
   - Add tests for nested conditions

### Medium Priority Additions

1. **dependentSchemas/dependentRequired** - Useful for complex forms
2. **jsonSchemaDialect** - Important for schema validation
3. **$defs Support** - Better alignment with JSON Schema
4. **Multiple examples** - Better documentation support

### Low Priority Additions

1. **$comment** - Documentation only
2. **propertyNames** - Edge case validation
3. **contentMediaType/Encoding/Schema** - Niche use cases

## Testing Recommendations

1. Create comprehensive test suites for v3.1 features:
   - Test specs in `e2e/schemas/` directory
   - Unit tests for each v3.1 feature
   - Integration tests for mixed v3.0/v3.1 usage

2. Add example projects showcasing v3.1 features:
   - Webhook example
   - Conditional schema example
   - Advanced JSON Schema features

3. Document version compatibility:
   - Create version support matrix
   - Add migration guide from v3.0 to v3.1
   - Document breaking changes

## Related Files

- `packages/oas/src/Oas.ts` - Core OAS class
- `packages/oas/src/utils.ts` - Version detection and parsing
- `packages/oas/src/types.ts` - Type definitions
- `packages/oas/src/infer/` - Type inference utilities
- `packages/plugin-oas/src/SchemaGenerator.ts` - Schema generation
- `packages/plugin-oas/src/SchemaMapper.ts` - Schema keyword mappings

## Conclusion

Kubb provides strong support for OpenAPI v3.0 and partial support for v3.1. The main gaps are:

1. **Missing v3.0 features**: callbacks, links
2. **Missing v3.1 features**: webhooks, advanced JSON Schema 2020-12 features

These additions would make Kubb more feature-complete and better aligned with the latest OpenAPI specifications.
