# Supporting Multiple Content Types

Kubb provides several ways to handle OpenAPI operations that support multiple content types (e.g., `application/json`, `application/xml`, `multipart/form-data`).

## Understanding Content Types in OpenAPI

An OpenAPI operation can define multiple content types for:
- **Request bodies**: Different formats the API can accept
- **Response bodies**: Different formats the API can return

Example from a PetStore API:
```yaml
paths:
  /pet:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
          application/xml:
            schema:
              $ref: '#/components/schemas/Pet'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
```

## Approach 1: Generate Separate Clients Per Content Type

The most straightforward approach is to generate separate client functions for each content type using multiple plugin instances with different `contentType` options.

```typescript
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    // Generate JSON client
    pluginClient({
      output: {
        path: './clients/json',
      },
      contentType: 'application/json',
      transformers: {
        name(name, type) {
          if (type === 'function') {
            return `${name}Json`
          }
          return name
        },
      },
    }),
    // Generate XML client
    pluginClient({
      output: {
        path: './clients/xml',
      },
      contentType: 'application/xml',
      transformers: {
        name(name, type) {
          if (type === 'function') {
            return `${name}Xml`
          }
          return name
        },
      },
    }),
  ],
})
```

This generates separate functions:
```typescript
// Use JSON
await addPetJson({ name: 'Fluffy', status: 'available' })

// Use XML
await addPetXml('<pet><name>Fluffy</name></pet>')
```

## Approach 2: Filter Operations by Content Type

You can use the `include`/`exclude` options with `type: 'contentType'` to generate clients only for operations that support specific content types:

```typescript
pluginClient({
  output: {
    path: './clients/xml',
  },
  contentType: 'application/xml',
  include: [
    {
      type: 'contentType',
      pattern: 'application/xml',
    },
  ],
})
```

## Approach 3: Override Options Per Content Type

Use the `override` option to customize behavior for specific content types:

```typescript
pluginClient({
  output: {
    path: './clients',
  },
  override: [
    {
      type: 'contentType',
      pattern: 'multipart/form-data',
      options: {
        parser: 'client', // Don't use Zod parser for multipart
      },
    },
    {
      type: 'contentType',
      pattern: 'application/xml',
      options: {
        transformers: {
          name(name, type) {
            if (type === 'function') {
              return `${name}Xml`
            }
            return name
          },
        },
      },
    },
  ],
})
```

## API: Checking for Multiple Content Types

The `@kubb/oas` package provides utility methods to check which content types an operation supports:

```typescript
import { Oas } from '@kubb/oas'

const oas = new Oas({ oas: yourOpenApiSpec })
await oas.dereference()

const paths = oas.getPaths()
const operation = paths['/pet']?.post

// Get all request content types
const requestContentTypes = oas.getRequestContentTypes(operation)
console.log(requestContentTypes)
// ['application/json', 'application/xml', 'application/x-www-form-urlencoded']

// Get all response content types
const responseContentTypes = oas.getResponseContentTypes(operation, '200')
console.log(responseContentTypes)
// ['application/json', 'application/xml']

// Get schemas for each content type
const requestSchemas = oas.getRequestSchemasByContentType(operation)
console.log(Object.keys(requestSchemas))
// ['application/json', 'application/xml', 'application/x-www-form-urlencoded']

const responseSchemas = oas.getResponseSchemasByContentType(operation, '200')
console.log(Object.keys(responseSchemas))
// ['application/json', 'application/xml']
```

## Future Enhancements

In future versions, Kubb may support:
- Discriminated union types for requests/responses with multiple content types
- A single client function that accepts a `contentType` parameter
- Runtime content-type negotiation

These features would allow for more flexible handling of multiple content types in a single function call.

## Example: PetStore with Multiple Content Types

See the `examples/client` directory for a complete example showing how to handle multiple content types using the approaches described above.
