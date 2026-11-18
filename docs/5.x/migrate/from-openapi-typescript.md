---
layout: doc
title: Move from openapi-typescript to Kubb
description: Replace openapi-typescript, openapi-fetch, and openapi-react-query with Kubb. Generate the same types, then swap the client and hooks one step at a time.
outline: [2, 3]
order: 3
navigation:
  title: Move from openapi-typescript
  icon: i-iconoir-git-fork
---

# Move from openapi-typescript to Kubb

Start with the types, then replace `openapi-fetch` and `openapi-react-query`. You can stop after any step.

openapi-typescript gets [no more updates, security fixes included](https://github.com/openapi-ts/openapi-typescript/issues/2874), and `openapi-fetch` and `openapi-react-query` are in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559). openapi-typescript 7.13.0 also needs TypeScript 5 and fails on TypeScript 7, which Kubb supports.

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
| `$api.useMutation('post', '/pet')` | `useMutation(addPetMutationOptions())` |

::steps{level="2"}

## Generate the types

Create this config. It writes every type into `src/gen/types.ts`, like the single `schema.d.ts` from openapi-typescript. `integerType: 'number'` keeps `int64` as `number`, as openapi-typescript does. Kubb's default is `bigint`.

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

Install the packages it imports. `kubb add` needs the config to exist, and leaves a plugin that is already in it unchanged:

:::code-group{sync="package-manager"}

```shell [kubb]
npm install -D kubb
kubb add adapter-oas
kubb add plugin-ts
```

```shell [pnpm]
pnpm add -D kubb @kubb/adapter-oas @kubb/plugin-ts
```

```shell [npm]
npm install -D kubb @kubb/adapter-oas @kubb/plugin-ts
```

```shell [yarn]
yarn add -D kubb @kubb/adapter-oas @kubb/plugin-ts
```

```shell [bun]
bun add -d kubb @kubb/adapter-oas @kubb/plugin-ts
```

:::

Change your `generate` script to `kubb generate` and run it. Leave `schema.d.ts` in place until the last step, because `openapi-fetch` reads it:

:::code-group

```json [Before]
{
  "scripts": {
    "generate": "openapi-typescript ./openapi.yaml -o ./src/schema.d.ts"
  }
}
```

```json [After]
{
  "scripts": {
    "generate": "kubb generate"
  }
}
```

:::

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

Run your type check and fix the imports it reports.

## Replace openapi-fetch

Add `@kubb/plugin-fetch`. It writes one function per operation, and the app needs no client package:

:::code-group{sync="package-manager"}

```shell [kubb]
kubb add plugin-fetch
```

```shell [pnpm]
pnpm add -D @kubb/plugin-fetch
```

```shell [npm]
npm install -D @kubb/plugin-fetch
```

```shell [yarn]
yarn add -D @kubb/plugin-fetch
```

```shell [bun]
bun add -d @kubb/plugin-fetch
```

:::

`kubb add` adds `pluginFetch()` to `plugins`. With a package manager, add the import and the plugin yourself. Then set its options:

```typescript [kubb.config.ts]
import { pluginFetch } from '@kubb/plugin-fetch'

// ...
plugins: [
  pluginTs({ output: { path: 'types.ts' } }),
  pluginFetch({ baseURL: 'https://petstore.swagger.io/v2', throwOnErrorDefault: false }),
],
```

`throwOnErrorDefault: false` keeps the `openapi-fetch` behavior: an error status resolves with `error` set instead of throwing. Run `kubb generate`, then replace each call:

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

client.interceptors.request.use((request) => {
  request.headers['Authorization'] = `Bearer ${token}`
  return request
})

const { data, error, status } = await getPetById({ path: { petId: 1 } })
```

:::

Like the middleware, the interceptor sends the header on every request. To send it only to operations that declare a security scheme, set `auth` instead. It gets each scheme, and its return value goes where that scheme says, such as the `api_key` header, so return the right credential per scheme:

```typescript
client.setConfig({ auth: (scheme) => (scheme.type === 'apiKey' ? apiKey : token) })
```

[Configure requests](/extensions/kubb-labs/plugin-fetch/guides/configure-requests) covers both.

## Replace openapi-react-query

Add [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query). With a package manager, also add `pluginReactQuery()` after `pluginFetch` in `plugins`:

:::code-group{sync="package-manager"}

```shell [kubb]
kubb add plugin-react-query
```

```shell [pnpm]
pnpm add -D @kubb/plugin-react-query
```

```shell [npm]
npm install -D @kubb/plugin-react-query
```

```shell [yarn]
yarn add -D @kubb/plugin-react-query
```

```shell [bun]
bun add -d @kubb/plugin-react-query
```

:::

The plugin writes query and mutation options per operation. Run `kubb generate`, then replace each `$api.useQuery` and `$api.useMutation` call:

:::code-group

```typescript [openapi-react-query]
import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { paths } from './schema'

const $api = createClient(createFetchClient<paths>({ baseUrl: 'https://petstore.swagger.io/v2' }))

const { data } = $api.useQuery('get', '/pet/{petId}', { params: { path: { petId: 1 } } })
const { mutate } = $api.useMutation('post', '/pet')
mutate({ body: { name: 'Rex', photoUrls: [] } })
```

```typescript [Kubb]
import { useMutation, useQuery } from '@tanstack/react-query'
import { addPetMutationOptions } from './gen/hooks/useAddPet'
import { getPetByIdQueryOptions } from './gen/hooks/useGetPetById'

const { data } = useQuery(getPetByIdQueryOptions({ path: { petId: 1 } }))
const { mutate } = useMutation(addPetMutationOptions())
mutate({ body: { name: 'Rex', photoUrls: [] } })
```

:::

## Remove openapi-typescript

Once nothing imports `schema.d.ts`, `openapi-fetch`, or `openapi-react-query`, delete `schema.d.ts` and uninstall `openapi-typescript`, `openapi-fetch`, and `openapi-react-query`.

::
