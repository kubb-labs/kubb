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

### Parameters with Style and Explode

Kubb correctly handles OpenAPI parameter serialization using the `style` and `explode` properties according to the OpenAPI specification.

#### Form Style with Explode

When a query parameter has `style: "form"` and `explode: true` (which is the default for query parameters), object properties are flattened into separate query parameters.

For objects with `additionalProperties` and no defined properties, Kubb generates a flattened type:

```yaml
parameters:
  - name: customFields
    in: query
    style: form
    explode: true
    schema:
      type: object
      additionalProperties:
        type: string
```

Generated TypeScript type:

```typescript
export type QueryParams = {
  [key: string]: string
}
```

This allows for dynamic query parameters like `?field1=value1&field2=value2` instead of nesting them under a single parameter name.

#### Without Explode

When `explode: false`, the object remains nested:

```yaml
parameters:
  - name: customFields
    in: query
    style: form
    explode: false
    schema:
      type: object
      additionalProperties:
        type: string
```

Generated TypeScript type:

```typescript
export type QueryParams = {
  customFields?: {
    [key: string]: string
  }
}
```

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

### Working with Large OpenAPI Specifications

For large APIs with many endpoints (100+ operations), consider these strategies:

**Split by Domain or Microservice**

Divide your OpenAPI specification into multiple files by domain:

```
specs/
├── pets-api.yaml
├── users-api.yaml
└── orders-api.yaml
```

Then use separate Kubb configurations for each:

```typescript [kubb.config.pets.ts]
export default defineConfig({
  input: { path: './specs/pets-api.yaml' },
  output: { path: './src/gen/pets' },
})
```

**Use $ref for Reusability**

Reference shared schemas across your specification:

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

paths:
  /pets:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
```

**Organize with Tags**

Use tags to logically group operations, which Kubb will use for code organization:

```yaml
paths:
  /pets:
    get:
      tags: ['pets']
      operationId: listPets
  /pets/{id}:
    get:
      tags: ['pets']
      operationId: getPetById
```

See [Best Practices](/knowledge-base/best-practices/) for how to leverage tags in your Kubb configuration.

### Creating OpenAPI Specifications

If you don't have an OpenAPI specification yet, you have several options:

1. **Manual Creation**: Use the [Swagger Editor](https://editor.swagger.io/) for an interactive editing experience
2. **Code-First Tools**: Generate specs from your existing code:
   - [tsoa](https://github.com/lukeautry/tsoa) for TypeScript/Node.js
   - [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction) for NestJS applications
   - [FastAPI](https://fastapi.tiangolo.com/) for Python (auto-generates OpenAPI)
3. **API-First Tools**: Design your API visually:
   - [Stoplight Studio](https://stoplight.io/studio)
   - [Postman](https://www.postman.com/)
4. **Reverse Engineering**: Generate from API requests:
   - [Hoppscotch](https://hoppscotch.io/)
   - [openapi-generator](https://openapi-generator.tech/)

## Best Practices

### Naming Conventions

1. **Use descriptive operationId**: Always define unique, descriptive `operationId` values for each operation. Kubb uses these to generate function names.

```yaml
# ❌ Avoid
operationId: get1

# ✅ Good
operationId: getPetById
```

2. **Use consistent naming patterns**: Follow a consistent pattern across your API for predictable generated code:
   - `getPets`, `getPetById`, `createPet`, `updatePet`, `deletePet`
   - `listUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`

### Schema Design

3. **Define schemas in components**: Place reusable schemas in `components/schemas` for better code reuse and to avoid duplication.

```yaml
components:
  schemas:
    Error:
      type: object
      properties:
        code:
          type: integer
        message:
          type: string
    
    Pet:
      type: object
      required: ['id', 'name']
      properties:
        id:
          type: integer
        name:
          type: string
```

4. **Use discriminators for polymorphism**: When working with inheritance or union types, use discriminators for better type generation:

```yaml
components:
  schemas:
    Pet:
      type: object
      discriminator:
        propertyName: petType
      properties:
        petType:
          type: string
```

5. **Array of enums**: When defining arrays with enum values, place the `enum` inside the `items` schema, not at the array level:

```yaml
# ❌ Incorrect (malformed schema)
schema:
  type: array
  enum: ["foo", "bar", "baz"]
  items:
    type: string

# ✅ Correct
schema:
  type: array
  items:
    type: string
    enum: ["foo", "bar", "baz"]
```

::: info
Kubb automatically normalizes malformed array enum schemas (where `enum` is at the array level) by moving the enum into the items schema. This ensures correct TypeScript types (`Type[]`) and Zod schemas (`z.array(z.enum([...]))`) are generated.
:::

### Organization

6. **Use tags consistently**: Group related operations with tags for organized code generation. This helps Kubb create logical folder structures.

```yaml
tags:
  - name: pets
    description: Pet operations
  - name: users
    description: User operations
```

7. **Include descriptions**: Add descriptions to schemas, operations, and parameters for better generated documentation and code comments.

```yaml
paths:
  /pets:
    get:
      summary: List all pets
      description: Returns a paginated list of pets with optional filtering
      operationId: listPets
```

### Versioning

8. **Version your API**: Use semantic versioning in your API paths or headers:

```yaml
servers:
  - url: https://api.example.com/v1
    description: Production API v1
```

9. **Document breaking changes**: Clearly mark deprecated endpoints and provide migration paths:

```yaml
paths:
  /legacy/pets:
    get:
      deprecated: true
      description: Use /pets instead
```

## Related Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Swagger Editor](https://editor.swagger.io/)
- [@kubb/plugin-oas](/plugins/plugin-oas/)
