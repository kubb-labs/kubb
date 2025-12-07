# OpenAPI Feature Gaps and Implementation Roadmap

This document outlines the features from OpenAPI v3.0 and v3.1 specifications that are not yet implemented in Kubb, prioritized by importance and community demand.

## High Priority Features

### 1. Webhooks (OpenAPI 3.1)

**Status:** ❌ Not Implemented  
**Priority:** High  
**Complexity:** Medium

**Description:**  
Webhooks are a new top-level object in OpenAPI 3.1 that describes outgoing HTTP requests that the API will send to subscribers. This is distinct from the regular `paths` object which describes incoming requests.

**Use Case:**
```yaml
webhooks:
  newPet:
    post:
      summary: New pet notification
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '200':
          description: Webhook received
```

**Implementation Plan:**
1. Add webhook parsing to `packages/oas/src/Oas.ts`
2. Create webhook type generation similar to path operations
3. Generate webhook handler types in `packages/plugin-oas`
4. Add tests in `e2e/schemas/openapi-3.1-features.yaml`

**Affected Files:**
- `packages/oas/src/Oas.ts`
- `packages/oas/src/types.ts`
- `packages/plugin-oas/src/OperationGenerator.ts`
- `packages/oas/src/infer/index.ts`

---

### 2. Callbacks (OpenAPI 3.0)

**Status:** ❌ Not Implemented  
**Priority:** High  
**Complexity:** Medium-High

**Description:**  
Callbacks describe asynchronous, out-of-band requests that your service will send to some other service in response to certain events.

**Implementation Plan:**
1. Add callback parsing in operation handling
2. Generate callback interface types
3. Support runtime expressions in callback URLs
4. Add callback documentation generation

**Affected Files:**
- `packages/oas/src/Oas.ts`
- `packages/plugin-oas/src/OperationGenerator.ts`
- `packages/oas/src/types.ts`

---

### 3. Links (OpenAPI 3.0)

**Status:** ❌ Not Implemented  
**Priority:** High  
**Complexity:** Medium

**Description:**  
Links represent possible interactions from a response, providing a way to describe HATEOAS relationships.

**Implementation Plan:**
1. Parse link objects from responses
2. Generate link helper types
3. Create link traversal utilities
4. Document link patterns

**Affected Files:**
- `packages/oas/src/Oas.ts`
- `packages/plugin-oas/src/generators/`
- `packages/oas/src/types.ts`

---

### 4. if/then/else Conditional Schemas (JSON Schema 2020-12)

**Status:** ❌ Not Implemented  
**Priority:** High  
**Complexity:** High

**Description:**  
Conditional schemas allow different validation rules based on conditions, essential for complex form validation and polymorphic types.

**Implementation Plan:**
1. Add conditional schema parsing in `SchemaGenerator.ts`
2. Generate union types for conditional branches
3. Handle nested conditions
4. Add validation logic generation for Zod plugin

**Affected Files:**
- `packages/plugin-oas/src/SchemaGenerator.ts`
- `packages/plugin-oas/src/SchemaMapper.ts`
- `packages/plugin-zod/src/` (for validation)

---

## Medium Priority Features

### 5. $defs (JSON Schema 2020-12)

**Status:** ❌ Not Implemented  
**Priority:** Medium  
**Complexity:** Low-Medium

**Description:**  
`$defs` is the modern way to define reusable schemas within a schema document, aligning with JSON Schema 2020-12.

### 6. dependentSchemas and dependentRequired (JSON Schema 2020-12)

**Status:** ❌ Not Implemented  
**Priority:** Medium  
**Complexity:** Medium

### 7. patternProperties (JSON Schema 2020-12)

**Status:** ❌ Not Implemented  
**Priority:** Medium  
**Complexity:** Medium

### 8. unevaluatedProperties and unevaluatedItems

**Status:** ❌ Not Implemented  
**Priority:** Medium  
**Complexity:** High

### 9. jsonSchemaDialect (OpenAPI 3.1)

**Status:** ❌ Not Implemented  
**Priority:** Medium  
**Complexity:** Low

### 10. Multiple examples Array (OpenAPI 3.1)

**Status:** ⚠️ Unknown  
**Priority:** Medium  
**Complexity:** Low

---

## Low Priority Features

11. **propertyNames** - Validates property names against a schema
12. **minContains / maxContains** - Array contains validation
13. **$comment** - Schema comments for documentation
14. **contentMediaType, contentEncoding, contentSchema** - Content validation

---

## Implementation Strategy

### Phase 1: Core 3.0 Completeness (High Priority)
- Implement callbacks support
- Implement links support
- Add comprehensive tests

**Timeline:** 2-3 sprints | **Effort:** ~40-60 hours

### Phase 2: Essential 3.1 Features (High Priority)
- Implement webhooks
- Implement if/then/else conditionals
- Add $defs support

**Timeline:** 3-4 sprints | **Effort:** ~60-80 hours

### Phase 3: Advanced JSON Schema Features (Medium Priority)
- dependentSchemas and dependentRequired
- patternProperties
- unevaluatedProperties/Items
- jsonSchemaDialect

**Timeline:** 4-5 sprints | **Effort:** ~80-100 hours

### Phase 4: Nice-to-Have Features (Low Priority)
- propertyNames
- minContains/maxContains
- Content validation features
- $comment support

**Timeline:** As needed | **Effort:** ~20-30 hours

## Testing Strategy

For each implemented feature:

1. **Unit Tests:** Add tests in respective package test files
2. **E2E Tests:** Extend `e2e/schemas/openapi-3.1-features.yaml`
3. **Integration Tests:** Create example projects in `examples/`
4. **Documentation:** Update `docs/openapi-feature-support.md`

## References

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema-core.html)
- [Migrating from OpenAPI 3.0 to 3.1](https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0)

## Related Documents

- [OpenAPI Feature Support](../openapi-feature-support.md) - Current feature support status
- [Test Specification](../../e2e/schemas/openapi-3.1-features.yaml) - Test cases for v3.1 features
