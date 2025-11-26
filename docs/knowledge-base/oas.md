---
layout: doc

title: OpenAPI/Swagger
outline: deep
---

# OpenAPI/Swagger <a href="/plugins/plugin-oas"><Badge type="info" text="@kubb/plugin-oas" /></a>

This guide explains the OpenAPI (formerly known as Swagger) specification and how Kubb uses it to generate code.

## What is OpenAPI?

The [OpenAPI Specification](https://www.openapis.org/) (OAS) is a standard, language-agnostic interface description for HTTP APIs. It allows both humans and computers to discover and understand the capabilities of a service without access to source code, documentation, or network traffic inspection.

### Supported Versions

Kubb supports the following OpenAPI/Swagger versions:

| Version | Status |
|---------|--------|
| Swagger 2.0 | ✅ Supported |
| OpenAPI 3.0 | ✅ Supported |
| OpenAPI 3.1 | ✅ Supported |

## Key Concepts

### Paths and Operations

Paths define the endpoints in your API, and operations define the HTTP methods (GET, POST, PUT, DELETE, etc.) available at each path.

```yaml
paths:
  /pets:
    get:
      operationId: getPets
      summary: List all pets
    post:
      operationId: createPet
      summary: Create a pet
```

### Schemas

Schemas define the structure of request and response bodies using JSON Schema.

```yaml
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
```

### Tags

Tags are used to group operations together. Kubb uses tags for organizing generated code into folders and files.

```yaml
tags:
  - name: pets
    description: Pet operations
```

## How Kubb Uses OpenAPI

Kubb reads your OpenAPI specification and generates code based on:

1. **Types**: Generated from `components/schemas`
2. **API Functions**: Generated from `paths` and their operations
3. **Hooks**: Generated for data fetching libraries (React Query, SWR, etc.)
4. **Mocks**: Generated from schemas using Faker.js

## Working with OpenAPI Files

### Validation

It's recommended to validate your OpenAPI file before using it with Kubb. The [`@kubb/plugin-oas`](/plugins/plugin-oas/) plugin includes built-in validation.

```typescript
import { pluginOas } from '@kubb/plugin-oas'

pluginOas({
  validate: true, // Enable validation
})
```

### Formatting and Filtering

For advanced filtering and sorting of your OpenAPI specification, you can use [openapi-format](https://www.npmjs.com/package/openapi-format) before passing it to Kubb.

See [Filter and Sort](/knowledge-base/filter-and-sort/) for more details on filtering operations.

## Best Practices

1. **Use operationId**: Always define unique `operationId` values for each operation. Kubb uses these to generate function names.

2. **Define schemas in components**: Place reusable schemas in `components/schemas` for better code reuse.

3. **Use tags consistently**: Group related operations with tags for organized code generation.

4. **Include descriptions**: Add descriptions to schemas and operations for better generated documentation.

## Related Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Swagger Editor](https://editor.swagger.io/)
- [@kubb/plugin-oas](/plugins/plugin-oas/)
