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

```typescript twoslash [kubb.config.pets.ts]
import { defineConfig } from '@kubb/core'

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

### Discriminators

Kubb provides comprehensive support for OpenAPI discriminators, which are used to handle polymorphism and union types in your API schemas. Discriminators help differentiate between multiple possible schemas in `oneOf` or `anyOf` constructs.

#### Supported Discriminator Patterns

Kubb supports all discriminator patterns from **OpenAPI 3.0** and **OpenAPI 3.1** specifications:

**OpenAPI 3.0 Patterns:**
- ✅ With explicit mapping
- ✅ Without mapping (inferred from schema names)
- ✅ With `oneOf`
- ✅ With `anyOf`
- ✅ Strict vs Inherit modes

**OpenAPI 3.1 Patterns:**
- ✅ With `$ref` in `oneOf`/`anyOf`
- ✅ Enhanced polymorphism support

**Edge Cases:**
- ✅ Inline schemas (not just `$ref`)
- ✅ Extension properties (e.g., `x-custom-name`)
- ✅ Const values
- ✅ Single-value enums
- ✅ Mixed `$ref` and inline schemas
- ✅ Title fallback
- ✅ Mixed types in `oneOf` (with extension properties)

#### Discriminator with Explicit Mapping

The most common pattern uses explicit mapping to connect discriminator values to specific schemas:

```yaml
components:
  schemas:
    Pet:
      type: object
      required: [petType]
      discriminator:
        propertyName: petType
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'

    Cat:
      type: object
      properties:
        petType:
          type: string
          enum: [cat]
        meow:
          type: boolean

    Dog:
      type: object
      properties:
        petType:
          type: string
          enum: [dog]
        bark:
          type: boolean
```

This generates proper TypeScript union types with discriminated unions for type narrowing.

#### Discriminator Without Mapping

When no explicit mapping is provided, Kubb infers the mapping from schema names:

```yaml
components:
  schemas:
    Animal:
      discriminator:
        propertyName: animalType
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
```

Kubb automatically creates mapping:
```
{
  Cat: '#/components/schemas/Cat',
  Dog: '#/components/schemas/Dog'
}
```

#### Discriminator with Inline Schemas

Kubb supports discriminators with inline schemas (not just `$ref`):

```yaml
components:
  schemas:
    Response:
      discriminator:
        propertyName: status
      oneOf:
        - type: object
          title: Success
          properties:
            status:
              type: string
              const: success
            data:
              type: object
        - type: object
          title: Error
          properties:
            status:
              type: string
              const: error
            message:
              type: string
```

For inline schemas, Kubb creates synthetic references and uses the `const` value or `title` for discriminator mapping.

#### Discriminator with Extension Properties

When using extension properties as discriminator property names (properties starting with `x-`):

```yaml
components:
  schemas:
    Data:
      discriminator:
        propertyName: x-custom-type  # Extension property
      oneOf:
        - type: object
          x-custom-type: TypeA
          properties:
            field1:
              type: string
        - type: object
          x-custom-type: TypeB
          properties:
            field2:
              type: number
```

Extension properties are treated as metadata and don't generate runtime validation constraints, but they still enable proper union type generation.

#### Discriminator Modes

Kubb supports two modes for discriminator handling:

**Strict Mode (default):**
```typescript
import { pluginOas } from '@kubb/plugin-oas'

pluginOas({
  discriminator: 'strict', // Default
})
```

In strict mode, the discriminator property is not automatically added to child schemas.

**Inherit Mode:**
```typescript
import { pluginOas } from '@kubb/plugin-oas'

pluginOas({
  discriminator: 'inherit',
})
```

In inherit mode, Kubb automatically adds the discriminator property with appropriate enum values to each child schema, ensuring type safety.

#### Best Practices for Discriminators

1. **Use consistent discriminator property names** across your API (e.g., always use `type` or `kind`)

2. **Provide explicit mapping** when using custom discriminator values

3. **Use const or single-value enum** for the discriminator property in child schemas:

```yaml
Cat:
  properties:
    petType:
      const: cat  # Preferred for discriminator values
```

4. **Ensure all oneOf/anyOf members share the same base type** when possible (all objects or all arrays, not mixed)

5. **Use standard properties (not extensions)** when runtime validation is needed

6. **Document the discriminator** in your schema description for API consumers

#### Known Limitations

- **Extension property discriminators**: When the discriminator property name is an extension (starts with `x-`), it's treated as metadata only and doesn't generate runtime validation constraints
- **Mixed types**: While technically supported (e.g., mixing object and array types in oneOf), it's not recommended per OpenAPI spec and may produce unexpected results with validation libraries

For more information about discriminators, see the [OpenAPI Specification](https://spec.openapis.org/oas/latest.html#discriminator-object).

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
