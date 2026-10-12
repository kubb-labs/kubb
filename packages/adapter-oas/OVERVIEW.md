# OpenAPI adapter

The OpenAPI adapter reads an OpenAPI 2.0, 3.0, or 3.1 document and converts every schema and operation into Kubb's AST. Every plugin in the build generates from that AST, so one adapter feeds them all.

Kubb uses `adapterOas()` by default. Set it on `defineConfig.adapter` only to change its options. The options apply to every plugin in the build.

```ts
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

## Options worth knowing

- `validate` checks the spec before parsing and reports each problem as a warning. Turn it off to speed up a large spec. Run `kubb validate` to list every error.
- `dateType` sets how `date-time`, `date`, and `time` schemas are represented: ISO strings (the default), strings with or without a timezone offset, or JavaScript `Date` objects. Pass an object to set each format on its own.
- `integerType` defaults to `'bigint'`, which is exact for 64-bit IDs but does not survive `JSON.stringify`. Choose `'number'` for most JSON APIs.
- `unknownType` and `emptySchemaType` set the type for schemas Kubb cannot infer and for empty schemas (`{}`).
- `discriminator: 'propagate'` writes the discriminator's literal value into each child schema, so each branch is typed precisely.
- `enums: 'root'` lifts inline enums to reusable top-level schemas, named with `enumSuffix` (`PetStatusEnum`).
- `server` picks the entry in the spec's `servers` array that becomes the base URL and fills in its variables. It does not change where a generated client sends requests. Use the client plugin's own `baseURL` for that.
- `contentType` picks the media type when an operation defines several. Without it, Kubb uses the first JSON media type.
