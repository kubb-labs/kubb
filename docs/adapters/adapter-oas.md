---
layout: doc

title: Kubb OAS Adapter - OpenAPI Specification Parser
description: Configure the OpenAPI adapter for Kubb. Control spec validation, date types, server URL, discriminator handling, and more with @kubb/adapter-oas.
outline: deep
---

# @kubb/adapter-oas

The OpenAPI adapter parses and converts your OpenAPI specification into Kubb's internal AST (Abstract Syntax Tree), which all downstream plugins consume.

The adapter is configured once in `defineConfig` and applies globally to all plugins.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/adapter-oas
```

```shell [pnpm]
pnpm add -D @kubb/adapter-oas
```

```shell [npm]
npm install --save-dev @kubb/adapter-oas
```

```shell [yarn]
yarn add -D @kubb/adapter-oas
```

:::

## Options

### validate

Validate the OpenAPI spec before parsing using `@readme/openapi-parser`.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

### contentType

Preferred content-type used when extracting request/response schemas from the spec.
Defaults to the first valid JSON media type found in the spec.

|           |                                |
| --------: | :----------------------------- |
|     Type: | `'application/json' \| string` |
| Required: | `false`                        |

::: code-group

```typescript [kubb.config.ts]
import { adapterOas } from '@kubb/adapter-oas'

adapterOas({ contentType: 'application/vnd.api+json' })
```

:::

### serverIndex

Index into the `servers` array from your OpenAPI spec for computing `baseURL`.

> [!TIP]
> Defining the server here will make it possible to use that endpoint as `baseURL` in other plugins.

|           |          |
| --------: | :------- |
|     Type: | `number` |
| Required: | `false`  |

- `0` will return the first server URL (e.g. `http://petstore.swagger.io/api`)
- `1` will return the second server URL (e.g. `http://localhost:3000`)

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
servers:
  - url: http://petstore.swagger.io/api
  - url: http://localhost:3000
```

```typescript [serverIndex 0]
import { adapterOas } from '@kubb/adapter-oas'

adapterOas({ serverIndex: 0 })
```

```typescript [serverIndex 1]
import { adapterOas } from '@kubb/adapter-oas'

adapterOas({ serverIndex: 1 })
```

:::

### serverVariables

Override values for `{variable}` placeholders in the selected server URL.

Only used when `serverIndex` is set. Variables not provided fall back to their `default` value from the spec.

|           |                          |
| --------: | :----------------------- |
|     Type: | `Record<string, string>` |
| Required: | `false`                  |

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
servers:
  - url: https://api.{env}.example.com
    variables:
      env:
        default: dev
        enum: [dev, staging, prod]
```

```typescript [kubb.config.ts]
import { adapterOas } from '@kubb/adapter-oas'

adapterOas({
  serverIndex: 0,
  serverVariables: { env: 'prod' },
})
// Results in baseURL: https://api.prod.example.com
```

:::

### discriminator

How the discriminator field is interpreted when processing `oneOf`/`anyOf` schemas.

See [Discriminators](/guide/oas#discriminators) in the knowledge base for detailed examples and supported patterns.

|           |                         |
| --------: | :---------------------- |
|     Type: | `'strict' \| 'inherit'` |
| Required: | `false`                 |
|  Default: | `'strict'`              |

- `'strict'` — uses `oneOf` schemas as written in the spec. The discriminator is used for type narrowing but child schemas are not modified.
- `'inherit'` — propagates the discriminator property with appropriate enum values into each child schema, ensuring type safety and enabling better code generation.

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
components:
  schemas:
    Animal:
      required: [type]
      type: object
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: type
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
    Cat:
      type: object
      properties:
        type:
          type: string
        indoor:
          type: boolean
    Dog:
      type: object
      properties:
        type:
          type: string
        name:
          type: string
```

```typescript [discriminator 'strict']
export type Cat = {
  type: string
  indoor?: boolean
}

export type Dog = {
  type: string
  name?: string
}

export type Animal = Cat | Dog
```

```typescript [discriminator 'inherit']
export type Cat = {
  type: 'cat'
  indoor?: boolean
}

export type Dog = {
  type: 'dog'
  name?: string
}

export type Animal = Cat | Dog
```

:::

### dateType

How `format: 'date-time'` schemas are represented in the generated AST and downstream output.

|           |                                                                  |
| --------: | :--------------------------------------------------------------- |
|     Type: | `false \| 'string' \| 'stringOffset' \| 'stringLocal' \| 'date'` |
| Required: | `false`                                                          |
|  Default: | `'string'`                                                       |

- `false` — falls through to a plain `string` type.
- `'string'` — emits a datetime string node (e.g. `z.string().datetime()`).
- `'stringOffset'` — emits a datetime node with timezone offset (`{ offset: true }`).
- `'stringLocal'` — emits a local datetime node (`{ local: true }`).
- `'date'` — emits a `date` node (JavaScript `Date` object).

::: code-group

```typescript [false]
// format: date-time → plain string
type CreatedAt = string
```

```typescript ['string' (default)]
// format: date-time → datetime string
type CreatedAt = string // validated as ISO 8601 datetime
```

```typescript ['stringOffset']
// format: date-time → datetime string with offset
type CreatedAt = string // validated as ISO 8601 datetime with offset
```

```typescript ['stringLocal']
// format: date-time → local datetime string
type CreatedAt = string // validated as local ISO 8601 datetime
```

```typescript ['date']
// format: date-time → JavaScript Date
type CreatedAt = Date
```

:::

### integerType

Whether `type: 'integer'` and `format: 'int64'` produce `number` or `bigint` nodes.

|           |                        |
| --------: | :--------------------- |
|     Type: | `'number' \| 'bigint'` |
| Required: | `false`                |
|  Default: | `'number'`             |

::: code-group

```typescript ['number' (default)]
type Pet = {
  id: number
}
```

```typescript ['bigint']
type Pet = {
  id: bigint
}
```

:::

### unknownType

AST type used when no schema type can be inferred from the OpenAPI spec.

|           |                                |
| --------: | :----------------------------- |
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `'any'`                        |

::: code-group

```typescript ['any' (default)]
type Pet = {
  extra: any
}
```

```typescript ['unknown']
type Pet = {
  extra: unknown
}
```

```typescript ['void']
type Pet = {
  extra: void
}
```

:::

### emptySchemaType

AST type used for completely empty schemas (`{}`).

> [!TIP]
> When not set, `emptySchemaType` falls back to the value of [`unknownType`](#unknownType). Set it explicitly only when you want a different type for empty schemas than for unresolvable ones.

|           |                                |
| --------: | :----------------------------- |
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `unknownType` \| `'any'`       |

::: code-group

```typescript ['any' (default)]
// empty schema {} → any
type EmptyModel = any
```

```typescript ['unknown']
// empty schema {} → unknown
type EmptyModel = unknown
```

:::

### enumSuffix

Suffix appended to derived enum names when building nested property schema names.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'enum'` |

::: code-group

```typescript ['enum' (default)]
// property `status` with inline enum values
const statusEnum = { available: 'available', pending: 'pending' } as const
type StatusEnum = (typeof statusEnum)[keyof typeof statusEnum]
```

```typescript ['type']
// enumSuffix: 'type'
const statusType = { available: 'available', pending: 'pending' } as const
type StatusType = (typeof statusType)[keyof typeof statusType]
```

:::

## Example

```typescript twoslash
import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas({
    validate: true,
    serverIndex: 0,
    serverVariables: { env: 'prod' },
    discriminator: 'inherit',
    dateType: 'date',
    integerType: 'number',
    unknownType: 'unknown',
    emptySchemaType: 'unknown',
    enumSuffix: 'enum',
  }),
  plugins: [pluginTs()],
})
```

## See Also

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [OpenAPI Discriminators](/guide/oas#discriminators)
