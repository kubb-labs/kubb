# OpenAPI

The OpenAPI adapter is the first step of every build. It converts your spec into Kubb's AST, and every plugin generates code from that AST, so the adapter's options apply to all of them.

The adapter downloads a remote `input` URL and any remote `$ref`s with a plain GET request, without credentials. It also reads the local files that external `$ref`s point to, even outside the spec's folder, and never writes files.

## Setup

Kubb uses `adapterOas()` by default, so no setup is needed. Set `adapter` in `defineConfig` only to change its options.

## Options worth knowing

- `validate` checks the spec before parsing and reports each problem as a warning. Turn it off to speed up a large spec. Run `kubb validate` to list every error.
- `dateType` sets how `date-time`, `date`, and `time` schemas are typed. Choose ISO strings (the default), `date-time` strings with or without a timezone offset, or JavaScript `Date` objects. Pass an object to set each format on its own.
- `integerType` sets how `int64` and `uint64` schemas are typed. The default `'bigint'` is exact for 64-bit IDs but does not survive `JSON.stringify`. Choose `'number'` for most JSON APIs.
- `unknownType` and `emptySchemaType` set the type for schemas Kubb cannot infer and for empty schemas (`{}`).
- `discriminator: 'propagate'` writes the discriminator's literal value into each child schema, so each branch is typed precisely.
- `enums: 'root'` lifts inline enums to reusable top-level schemas, named with `enumSuffix` (`PetStatusEnum`).
- `server` picks the entry in the spec's `servers` array that becomes the base URL and fills in its variables. It does not change where a generated client sends requests. Use the client plugin's own `baseURL` for that.
- `contentType` picks one media type when an operation declares several. Without it, Kubb keeps every media type the operation declares.

See [Options](https://kubb.dev/extensions/kubb-labs/adapter-oas/options) for every option and its default.

## Example

The config below types dates as `Date` objects and 64-bit integers as numbers.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ dateType: 'date', integerType: 'number' }),
  plugins: [
    pluginTs(),
  ],
})
```
