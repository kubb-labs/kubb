---
layout: doc
title: Move from openapi-typescript to Kubb
description: Replace openapi-typescript, openapi-fetch, and openapi-react-query with Kubb. Generate the same types, then swap the client and hooks one step at a time.
outline: [2, 3]
order: 6
navigation:
  title: Move from openapi-typescript
  icon: i-iconoir-git-fork
---

# Move from openapi-typescript to Kubb

Generate your types with Kubb first, then replace `openapi-fetch` and `openapi-react-query` when you are ready. Each step works on its own, so you can stop after the types.

`openapi-fetch` and `openapi-react-query` are in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559) with no future updates. Kubb generates the types, the client, and the hooks from one config. [Kubb vs openapi-typescript](/docs/5.x/explanation/comparison) compares the tools.

## What maps to what

| openapi-typescript | Kubb |
| --- | --- |
| `openapi-typescript ./openapi.yaml -o ./src/schema.d.ts` | `kubb generate` with a `kubb.config.ts` |
| `components['schemas']['Pet']` | `Pet` |
| `paths['/pet/{petId}']['get']['parameters']['path']` | `GetPetByIdPath` |
| `paths['/pet/{petId}']['get']['responses'][200]['content']['application/json']` | `GetPetByIdResponse` |
| `--enum` | [`enum.type: 'enum'`](/extensions/kubb-labs/plugin-ts/options#enumtype) on `pluginTs` |
| `client.GET('/pet/{petId}', { params: { path: { petId: 1 } } })` | `getPetById({ path: { petId: 1 } })` |
| `createClient({ baseUrl })` | `client.setConfig({ baseURL })` |
| `client.use({ onRequest, onResponse })` | `client.interceptors.request.use()` and `client.interceptors.response.use()` |
| `const { data, error } = await client.GET(...)` | `throwOnErrorDefault: false` on `pluginFetch` |
| `$api.useQuery('get', '/pet/{petId}', ...)` | [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query) |

::steps{level="2"}

## Install Kubb

Install `kubb` and `@kubb/plugin-ts`. Keep openapi-typescript installed until your code compiles against the new types.

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm add -D kubb @kubb/plugin-ts
```

```shell [npm]
npm install -D kubb @kubb/plugin-ts
```

```shell [yarn]
yarn add -D kubb @kubb/plugin-ts
```

```shell [bun]
bun add -d kubb @kubb/plugin-ts
```

:::

## Generate the types

This config writes every type into one file, `src/gen/types.ts`, like the single `schema.d.ts` openapi-typescript writes. Remove `output` from `pluginTs` to get one file per schema and operation instead.

openapi-typescript types `int64` as `number`, while Kubb types it as `bigint` by default. Set `integerType: 'number'` on the adapter to keep your current types:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [pluginTs({ output: { path: 'types.ts' } })],
})
```

Replace the openapi-typescript command in `package.json` with `kubb generate`:

```json [package.json]
{
  "scripts": {
    "generate": "kubb generate"
  }
}
```

Run `npm run generate`, then open `src/gen/types.ts`. [`@kubb/plugin-ts` options](/extensions/kubb-labs/plugin-ts/options) change how enums, objects, and optional fields are written.

## Replace the type lookups

openapi-typescript nests every type under `paths`, `components`, and `operations`. Kubb exports each one by name, so a lookup becomes an import:

:::code-group

```typescript [openapi-typescript]
import type { components, paths } from './schema'

type Pet = components['schemas']['Pet']
type GetPetByIdParams = paths['/pet/{petId}']['get']['parameters']['path']
type GetPetByIdResult = paths['/pet/{petId}']['get']['responses'][200]['content']['application/json']
```

```typescript [Kubb]
import type { GetPetByIdPath, GetPetByIdResponse, Pet } from './gen/types'
```

:::

Each operation is named after its `operationId`. Run your type check and fix the imports it reports, then remove `openapi-typescript` and the old `schema.d.ts`.

## Replace openapi-fetch

Skip this step to keep `openapi-fetch` for now. It still works with its own types.

Install `@kubb/plugin-fetch` and add it to the config. It writes one function per operation and copies its runtime into `src/gen/.kubb/`, so the app needs no client package:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'

export default defineConfig({
  input: './openapi.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs({ output: { path: 'types.ts' } }),
    pluginFetch({ baseURL: 'https://petstore.swagger.io/v2', throwOnErrorDefault: false }),
  ],
})
```

`openapi-fetch` returns `{ data, error }` and never throws on an error status. `throwOnErrorDefault: false` keeps that behavior. Leave it out to throw a `ResponseError` on every non-2xx response instead.

Replace each call by path with a call to the generated function:

:::code-group

```typescript [openapi-fetch]
import createClient from 'openapi-fetch'
import type { paths } from './schema'

const client = createClient<paths>({ baseUrl: 'https://petstore.swagger.io/v2' })
client.use({
  onRequest({ request }) {
    request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
})

const { data, error } = await client.GET('/pet/{petId}', { params: { path: { petId: 1 } } })
```

```typescript [Kubb]
import { client } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

client.setConfig({ auth: () => token })

const { data, error, status } = await getPetById({ path: { petId: 1 } })
```

:::

`auth` puts the token where each security scheme in your spec says. For other shared headers, use `headers` or a request interceptor. [Configure requests](/extensions/kubb-labs/plugin-fetch/guides/configure-requests) covers the base URL, auth, and interceptors, and [Handle errors](/extensions/kubb-labs/plugin-fetch/guides/error-handling) covers the result shape. Then remove `openapi-fetch`.

## Replace openapi-react-query

Add [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query) next to `@kubb/plugin-fetch`. It writes query keys and query options per operation, which you pass to TanStack Query's `useQuery`. Then remove `openapi-react-query`.

::

## Next steps

::card-group

:::card{title="Pick a stack" to="/docs/5.x/how-to/recipes#pick-a-stack"}
Configs for Zod, MSW, Faker, and other plugins on top of the types.
:::

:::card{title="Customize generated code" to="/docs/5.x/how-to/customize"}
Rename types and files to match the names your code already uses.
:::

::
