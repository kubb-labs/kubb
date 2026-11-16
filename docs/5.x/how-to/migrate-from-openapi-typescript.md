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

Start with the types, then replace `openapi-fetch` and `openapi-react-query`. You can stop after any step.

`openapi-fetch` and `openapi-react-query` are in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559). openapi-typescript 7.13.0 needs TypeScript 5 and fails on TypeScript 7, which Kubb supports.

## What maps to what

| openapi-typescript | Kubb |
| --- | --- |
| `components['schemas']['Pet']` | `Pet` |
| `paths['/pet/{petId}']['get']['parameters']['path']` | `GetPetByIdPath` |
| `paths['/pet/{petId}']['get']['responses'][200]['content']['application/json']` | `GetPetByIdStatus200Json` |
| `--enum` | [`enum: { type: 'enum' }`](/extensions/kubb-labs/plugin-ts/options#enumtype) on `pluginTs` |
| `client.GET('/pet/{petId}', { params: { path: { petId: 1 } } })` | `getPetById({ path: { petId: 1 } })` |
| `createClient({ baseUrl })` | `client.setConfig({ baseURL })` |
| `client.use({ onRequest })` | `client.interceptors.request.use()` |
| `$api.useQuery('get', '/pet/{petId}', ...)` | `useQuery(getPetByIdQueryOptions(...))` |

::steps{level="2"}

## Generate the types

Install `kubb` and `@kubb/plugin-ts`:

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

This config writes every type into `src/gen/types.ts`, like the single `schema.d.ts` from openapi-typescript. `integerType: 'number'` keeps `int64` as `number`, as openapi-typescript does. Kubb's default is `bigint`.

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

Replace the openapi-typescript command in your `generate` script with `kubb generate`, and run it.

## Replace the type lookups

Kubb exports each type by name, named after the schema or the `operationId`:

:::code-group

```typescript [openapi-typescript]
import type { components, paths } from './schema'

type Pet = components['schemas']['Pet']
type GetPetByIdParams = paths['/pet/{petId}']['get']['parameters']['path']
```

```typescript [Kubb]
import type { GetPetByIdPath, Pet } from './gen/types'
```

:::

Run your type check and fix the imports it reports. `openapi-fetch` still imports `paths`, so keep `schema.d.ts` until the next step is done.

## Replace openapi-fetch

Install `@kubb/plugin-fetch` and add it to `plugins`. It writes one function per operation, and the app needs no client package:

```typescript [kubb.config.ts]
plugins: [
  pluginTs({ output: { path: 'types.ts' } }),
  pluginFetch({ baseURL: 'https://petstore.swagger.io/v2', throwOnErrorDefault: false }),
],
```

`throwOnErrorDefault: false` keeps the `openapi-fetch` behavior: an error status resolves with `error` set instead of throwing.

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

`auth` sends the token where the spec's security scheme says, such as an `api_key` header. [Configure requests](/extensions/kubb-labs/plugin-fetch/guides/configure-requests) covers headers and interceptors.

Then remove `openapi-fetch`, `openapi-typescript`, and `schema.d.ts`.

## Replace openapi-react-query

Add [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query) to `plugins`. It writes query keys and query options per operation:

```typescript
import { useQuery } from '@tanstack/react-query'
import { getPetByIdQueryOptions } from './gen/hooks/useGetPetById'

const { data } = useQuery(getPetByIdQueryOptions({ path: { petId: 1 } }))
```

Then remove `openapi-react-query`.

::
