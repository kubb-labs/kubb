---
layout: doc
title: Move from HeyAPI to Kubb
description: Replace HeyAPI (@hey-api/openapi-ts) with Kubb. Generate the same types, then swap the SDK, TanStack Query options, and Zod schemas one step at a time.
outline: [2, 3]
order: 2
navigation:
  title: Move from HeyAPI
  icon: i-iconoir-git-fork
---

# Move from HeyAPI to Kubb

Start with the types, then replace one HeyAPI plugin at a time: the SDK and client, TanStack Query, and Zod. You can stop after any step.

`@hey-api/openapi-ts` 0.99.0 fails on TypeScript 7, which Kubb supports.

The examples move a HeyAPI config that writes to `src/client` with the `@hey-api/client-fetch`, `@hey-api/typescript`, `@hey-api/sdk`, `@tanstack/react-query`, and `zod` plugins.

## The config, before and after

The Kubb config is the result of every step below. Each step adds one plugin to it.

::code-group

```typescript [openapi-ts.config.ts]
import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: 'src/client',
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk', '@tanstack/react-query', 'zod'],
})
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './openapi.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs({ output: { path: 'types.ts' } }),
    // The Petstore URL is an example. Use your API's URL.
    pluginFetch({ baseURL: 'https://petstore3.swagger.io/api/v3', throwOnErrorDefault: false }),
    pluginReactQuery(),
    pluginZod(),
  ],
})
```

::

## What maps to what

### Config options

| HeyAPI | Kubb |
| --- | --- |
| `input`, `output` | `input`, `output.path` |
| `@hey-api/typescript` | [`pluginTs`](/extensions/kubb-labs/plugin-ts) |
| `@hey-api/client-fetch` with `@hey-api/sdk` | [`pluginFetch`](/extensions/kubb-labs/plugin-fetch) |
| `@hey-api/client-axios` with `@hey-api/sdk` | [`pluginAxios`](/extensions/kubb-labs/plugin-axios) |
| `validator: true` on `@hey-api/sdk` | [`validator`](/extensions/kubb-labs/plugin-fetch/options#validator) on `pluginFetch` |
| `@tanstack/react-query` | [`pluginReactQuery`](/extensions/kubb-labs/plugin-react-query) |
| `zod` | [`pluginZod`](/extensions/kubb-labs/plugin-zod) |

### Generated code

| HeyAPI | Kubb |
| --- | --- |
| `GetPetByIdData` | `GetPetByIdOptions` |
| `GetPetByIdData['path']` | `GetPetByIdPath` |
| `GetPetByIdResponse` | `GetPetByIdStatus200Json` |
| `getPetById({ path: { petId: 1 } })` | Unchanged |
| `client.setConfig({ baseUrl, auth })` | `client.setConfig({ baseURL, auth })` |
| `client.interceptors.request.use()` | The same call. Set a header with `request.headers['X-Client'] = 'web'`, not `request.headers.set()` |
| `getPetByIdOptions(...)` | `getPetByIdQueryOptions(...)` |
| `addPetMutation()` | `addPetMutationOptions()` |
| `zPet`, `zGetPetByIdPath` | `petSchema`, `getPetByIdPathSchema` |

::steps{level="2"}

## Generate the types

Create this config. It writes every type into `src/gen/types.ts`, like the single `types.gen.ts` from HeyAPI. `integerType: 'number'` keeps `int64` as `number`, as HeyAPI does. Kubb's default is `bigint`.

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

Change your `generate` script to `kubb generate` and run it. Leave `src/client` in place until the last step, because the rest of the app still imports it. Those files stop following the spec once HeyAPI no longer runs. If you pause before the last step, use `openapi-ts && kubb generate` as the script:

:::code-group

```json [Before]
{
  "scripts": {
    "generate": "openapi-ts"
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

Then replace the type imports. Schema types keep their names. Kubb exports each part of a request by name, and names a response after its status and media type:

:::code-group

```typescript [HeyAPI]
import type { GetPetByIdData, GetPetByIdResponse, Pet } from './client'

type Path = GetPetByIdData['path']
```

```typescript [Kubb]
import type { GetPetByIdPath, GetPetByIdStatus200Json, Pet } from './gen/types'
```

:::

Run your type check and fix the imports it reports.

## Replace the SDK and client

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

`kubb add` adds `pluginFetch()` to `plugins`. With a package manager, add the import and the plugin yourself. Then set its options, with your API's URL as `baseURL`. The Petstore URL is an example:

```typescript [kubb.config.ts]
import { pluginFetch } from '@kubb/plugin-fetch'

// ...
plugins: [
  pluginTs({ output: { path: 'types.ts' } }),
  pluginFetch({ baseURL: 'https://petstore3.swagger.io/api/v3', throwOnErrorDefault: false }),
],
```

`throwOnErrorDefault: false` keeps the HeyAPI behavior: an error status resolves with `error` set instead of throwing. HeyAPI reads the base URL from the spec's `servers`. Kubb does not, so set `baseURL`. Run `kubb generate`, then replace each import. The calls keep their shape:

:::code-group

```typescript [HeyAPI]
import { getPetById } from './client'
import { client } from './client/client.gen'

client.setConfig({ auth: () => token })
client.interceptors.request.use((request) => {
  request.headers.set('X-Client', 'web')
  return request
})

const { data, error } = await getPetById({ path: { petId: 1 } })
```

```typescript [Kubb]
import { client } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

client.setConfig({ auth: () => token })
client.interceptors.request.use((request) => {
  request.headers['X-Client'] = 'web'
  return request
})

const { data, error, status } = await getPetById({ path: { petId: 1 } })
```

:::

Three things differ:

- The result also has `status`, and a check on it narrows `data` and `error`.
- With `throwOnError: true` on a call, HeyAPI throws the error body. Kubb throws a `ResponseError` with the body in `error.data`. See [Handle errors](/extensions/kubb-labs/plugin-fetch/guides/error-handling).
- When an operation lists several security schemes, HeyAPI sends the token to each of them. Kubb sends the first one that `auth` returns a token for, so return the right credential per scheme:

```typescript
client.setConfig({ auth: (scheme) => (scheme.type === 'apiKey' ? apiKey : token) })
```

[Configure requests](/extensions/kubb-labs/plugin-fetch/guides/configure-requests) covers `auth` and interceptors.

## Replace TanStack Query

Add [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query). With a package manager, also import `pluginReactQuery` from `@kubb/plugin-react-query` and add `pluginReactQuery()` after `pluginFetch` in `plugins`:

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

The plugin writes query and mutation options per operation, as HeyAPI does. Run `kubb generate`, then replace each import:

:::code-group

```typescript [HeyAPI]
import { useMutation, useQuery } from '@tanstack/react-query'
import { addPetMutation, getPetByIdOptions } from './client/@tanstack/react-query.gen'

const { data } = useQuery(getPetByIdOptions({ path: { petId: 1 } }))
const { mutate } = useMutation(addPetMutation())
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

## Replace the Zod schemas

Add [`@kubb/plugin-zod`](/extensions/kubb-labs/plugin-zod). With a package manager, also import `pluginZod` from `@kubb/plugin-zod` and add `pluginZod()` to `plugins`. The schemas need Zod 4, so upgrade `zod` first if the app is on Zod 3:

:::code-group{sync="package-manager"}

```shell [kubb]
kubb add plugin-zod
```

```shell [pnpm]
pnpm add -D @kubb/plugin-zod
```

```shell [npm]
npm install -D @kubb/plugin-zod
```

```shell [yarn]
yarn add -D @kubb/plugin-zod
```

```shell [bun]
bun add -d @kubb/plugin-zod
```

:::

Kubb writes one file per schema and ends each name in `Schema`, where HeyAPI starts it with `z`. Run `kubb generate`, then replace each import:

:::code-group

```typescript [HeyAPI]
import { zGetPetByIdPath, zPet } from './client/zod.gen'

const pet = zPet.parse(json)
const path = zGetPetByIdPath.parse(params)
```

```typescript [Kubb]
import { getPetByIdPathSchema } from './gen/zod/getPetByIdSchema'
import { petSchema } from './gen/zod/petSchema'

const pet = petSchema.parse(json)
const path = getPetByIdPathSchema.parse(params)
```

:::

If `@hey-api/sdk` has `validator: true`, set [`validator`](/extensions/kubb-labs/plugin-fetch/options#validator) on `pluginFetch` so the client checks requests and responses against these schemas:

```typescript [kubb.config.ts]
pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } }),
```

## Remove HeyAPI

Once nothing imports from `src/client`, delete `src/client` and `openapi-ts.config.ts`, and uninstall `@hey-api/openapi-ts`.

::
