# OpenAPI

The OpenAPI adapter reads an OpenAPI 2.0, 3.0, 3.1, or 3.2 spec and converts it into the AST that every plugin generates code from.

- It is the first step of every build, so its options apply to all plugins.
- It downloads a remote `input` URL and any remote `$ref` with a plain GET request, without credentials.
- It reads the local files that external `$ref`s point to, even outside the spec's folder, and never writes files.

## Setup

No setup is needed. `defineConfig` uses `adapterOas()` by default. Set `adapter` only to change its options.

## Options worth knowing

| Option                                                                                           | Default          | What it does                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`validate`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#validate)                 | `true`           | Checks the spec and reports each problem as a warning. Turn it off to speed up a large spec.                     |
| [`dateType`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#datetype)                 | `'string'`       | Types `date-time`, `date`, and `time` as strings or as `Date` objects.                                           |
| [`integerType`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype)           | `'bigint'`       | Types `int64` and `uint64` as `bigint` or `number`. Choose `'number'` for most JSON APIs.                        |
| [`enums`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#enums)                       | `'inline'`       | `'root'` lifts inline enums to top-level schemas, such as `PetStatusEnum`.                                       |
| [`discriminator`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#discriminator)       | `'preserve'`     | `'propagate'` writes the discriminator value into each child schema.                                             |
| [`pathParamsCasing`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#pathparamscasing) | None             | `'camelcase'` renames path parameters, such as `{pet-id}` to `petId`.                                            |
| [`server`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#server)                     | None             | Picks the `servers` entry that becomes the document `baseURL`. It does not change where a client sends requests. |
| [`contentType`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#contenttype)           | Every media type | Keeps one media type when an operation declares several.                                                         |

Run [`kubb validate`](https://kubb.dev/docs/5.x/reference/commands/validate) to list every spec error.

## Example

This config types dates as `Date` objects and 64-bit integers as numbers, so `@kubb/plugin-ts` writes this `Order` type:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ dateType: 'date', integerType: 'number' }),
  plugins: [pluginTs()],
})
```

```typescript [src/gen/types/Order.ts]
// excerpt, without JSDoc
export type Order = {
  id?: number // int64, `bigint` by default
  petId?: number
  quantity?: number // int32
  shipDate?: Date // date-time, `string` by default
  complete?: boolean
}
```

::
