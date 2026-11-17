---
layout: doc
title: Move from orval to Kubb
description: Replace orval with Kubb. Generate the same types, then swap the client, query hooks, Zod schemas, and MSW mocks one step at a time.
outline: [2, 3]
order: 7
navigation:
  title: Move from orval
  icon: i-iconoir-git-fork
---

# Move from orval to Kubb

Start with the types, then replace one orval output at a time: the client, the query hooks, the Zod schemas, and the mocks. You can stop after any step.

The examples move an orval config with `client: 'react-query'`, `httpClient: 'fetch'`, `mock: true`, and a second `client: 'zod'` output, all written to `src/api`.

## What maps to what

| orval | Kubb |
| --- | --- |
| `output.schemas`, `Pet` from `./api/model` | [`pluginTs`](/extensions/kubb-labs/plugin-ts), `Pet` from `./gen/types` |
| `PetStatus` | `petStatusEnum` and `PetStatusEnumKey` |
| `httpClient: 'fetch'` | [`pluginFetch`](/extensions/kubb-labs/plugin-fetch) |
| `httpClient: 'axios'` | [`pluginAxios`](/extensions/kubb-labs/plugin-axios) |
| `output.baseUrl` | [`baseURL`](/extensions/kubb-labs/plugin-fetch/options#baseurl) on `pluginFetch` |
| `mode: 'tags-split'` | [`group: { type: 'tag' }`](/docs/5.x/reference/plugin-options#group) on each plugin. It needs directory output, so remove the `output` option from `pluginTs` first |
| A custom `mutator` | `client.setConfig()` and `client.interceptors` |
| `getPetById(1)` | `getPetById({ path: { petId: 1 } })` |
| `client: 'react-query'`, `useGetPetById(1)` | [`pluginReactQuery({ hooks: true })`](/extensions/kubb-labs/plugin-react-query/options#hooks), `useGetPetById({ path: { petId: 1 } })` |
| `mutate({ data: pet })` | `mutate({ body: pet })` |
| `client: 'zod'`, `GetPetByIdResponse` | [`pluginZod`](/extensions/kubb-labs/plugin-zod), `petSchema` |
| `mock: true`, `getGetPetByIdMockHandler()`, `getPetMock()` | [`pluginMsw`](/extensions/kubb-labs/plugin-msw), `getPetByIdHandler()`, `handlers` |
| `getGetPetByIdResponseMock()` | [`pluginFaker`](/extensions/kubb-labs/plugin-faker), `createPet()` |

::steps{level="2"}

## Generate the types

Create this config. It writes every type into `src/gen/types.ts`. `integerType: 'number'` keeps `int64` as `number`, as orval does. Kubb's default is `bigint`.

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
npx kubb add adapter-oas
npx kubb add plugin-ts
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

Add `kubb generate` to your `generate` script and run it. Keep `orval` until the last step, because the rest of the app still imports its output:

:::code-group

```json [Before]
{
  "scripts": {
    "generate": "orval"
  }
}
```

```json [During the move]
{
  "scripts": {
    "generate": "orval && kubb generate"
  }
}
```

:::

Then replace the model imports. Kubb names an enum's values `petStatusEnum` and its type `PetStatusEnumKey`:

:::code-group

```typescript [orval]
import type { Pet } from './api/model'
import { PetStatus } from './api/model'

const status: PetStatus = PetStatus.available
```

```typescript [Kubb]
import type { Pet, PetStatusEnumKey } from './gen/types'
import { petStatusEnum } from './gen/types'

const status: PetStatusEnumKey = petStatusEnum.available
```

:::

Run your type check and fix the imports it reports.

## Replace the client

Add `@kubb/plugin-fetch`. It writes one function per operation, and the app needs no client package:

:::code-group{sync="package-manager"}

```shell [kubb]
npx kubb add plugin-fetch
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

`throwOnErrorDefault: false` keeps the behavior of orval's fetch client: an error status resolves instead of throwing. orval puts the error body in `data`. Kubb puts it in `error` and leaves `data` undefined. Run `kubb generate`, then replace each call:

:::code-group

```typescript [orval]
import { getPetById } from './api/pet/pet'

const { data, status } = await getPetById(1, {
  headers: { Authorization: `Bearer ${token}` },
})
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

The interceptor sends the header on every request, like a custom `mutator` that sets it. To send a credential only to operations that declare a security scheme, set `auth` instead. It gets each scheme, and its return value goes where that scheme says, such as the `api_key` header:

```typescript
client.setConfig({ auth: (scheme) => (scheme.type === 'apiKey' ? apiKey : token) })
```

[Configure requests](/extensions/kubb-labs/plugin-fetch/guides/configure-requests) covers both.

## Replace the query hooks

Add [`@kubb/plugin-react-query`](/extensions/kubb-labs/plugin-react-query). With a package manager, also import `pluginReactQuery` from `@kubb/plugin-react-query` and add `pluginReactQuery()` after `pluginFetch` in `plugins`:

:::code-group{sync="package-manager"}

```shell [kubb]
npx kubb add plugin-react-query
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

Set `hooks: true` to get `useGetPetById` and `useAddPet`, as orval writes them. Without it, the plugin writes only the query and mutation options:

```typescript [kubb.config.ts]
pluginReactQuery({ hooks: true }),
```

Run `kubb generate`, then replace each hook. Two things differ from hooks on orval's fetch client:

- A hook's `data` holds the response body, not `{ data, status, headers }`.
- An error status goes to the hook's `error` and to `onError`, whatever `throwOnErrorDefault` says. With orval it resolves as `data`, so move any `status` check on `data` there.

:::code-group

```typescript [orval]
import { useAddPet, useGetPetById } from './api/pet/pet'

const { data } = useGetPetById(1)
const pet = data?.data

const { mutate } = useAddPet()
mutate({ data: { name: 'Rex', photoUrls: [] } })
```

```typescript [Kubb]
import { useAddPet } from './gen/hooks/useAddPet'
import { useGetPetById } from './gen/hooks/useGetPetById'

const { data: pet } = useGetPetById({ path: { petId: 1 } })

const { mutate } = useAddPet()
mutate({ body: { name: 'Rex', photoUrls: [] } })
```

:::

## Replace the Zod schemas

Add [`@kubb/plugin-zod`](/extensions/kubb-labs/plugin-zod). With a package manager, also import `pluginZod` from `@kubb/plugin-zod` and add `pluginZod()` to `plugins`. The schemas need Zod 4, so upgrade `zod` first if the app is on Zod 3:

:::code-group{sync="package-manager"}

```shell [kubb]
npx kubb add plugin-zod
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

orval writes one schema per operation and inlines the model in each. Kubb writes one schema per model, such as `petSchema`, and the operation schemas refer to it. Run `kubb generate`, then replace each import:

:::code-group

```typescript [orval]
import { GetPetByIdParams, GetPetByIdResponse } from './api/pet/pet.zod'

const pet = GetPetByIdResponse.parse(json)
const path = GetPetByIdParams.parse(params)
```

```typescript [Kubb]
import { getPetByIdPathSchema } from './gen/zod/getPetByIdSchema'
import { petSchema } from './gen/zod/petSchema'

const pet = petSchema.parse(json)
const path = getPetByIdPathSchema.parse(params)
```

:::

## Replace the mocks

Add [`@kubb/plugin-faker`](/extensions/kubb-labs/plugin-faker) and [`@kubb/plugin-msw`](/extensions/kubb-labs/plugin-msw). The generated code needs MSW 3 and `@faker-js/faker` 10, so upgrade them first if the app is on older versions:

:::code-group{sync="package-manager"}

```shell [kubb]
npx kubb add plugin-faker
npx kubb add plugin-msw
```

```shell [pnpm]
pnpm add -D @kubb/plugin-faker @kubb/plugin-msw
```

```shell [npm]
npm install -D @kubb/plugin-faker @kubb/plugin-msw
```

```shell [yarn]
yarn add -D @kubb/plugin-faker @kubb/plugin-msw
```

```shell [bun]
bun add -d @kubb/plugin-faker @kubb/plugin-msw
```

:::

Set the options on `pluginMsw`. `parser: 'faker'` makes a handler return generated data, like orval's mocks, and `handlers: true` exports every handler as one list:

```typescript [kubb.config.ts]
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'

// ...
plugins: [
  // ...
  pluginFaker(),
  pluginMsw({ baseURL: 'https://petstore3.swagger.io/api/v3', parser: 'faker', handlers: true }),
],
```

Run `kubb generate`, then replace the handlers and the mock data:

:::code-group

```typescript [orval]
import { setupServer } from 'msw/node'
import { getGetPetByIdResponseMock } from './api/pet/pet.faker'
import { getGetPetByIdMockHandler, getPetMock } from './api/pet/pet.msw'

export const server = setupServer(getGetPetByIdMockHandler({ name: 'Rex', photoUrls: [] }), ...getPetMock())

const pet = getGetPetByIdResponseMock({ name: 'Rex' })
```

```typescript [Kubb]
import { setupServer } from 'msw/node'
import { getPetByIdHandler } from './gen/handlers/getPetByIdHandler'
import { handlers } from './gen/handlers/handlers'
import { createPet } from './gen/mocks/createPet'

export const server = setupServer(getPetByIdHandler({ name: 'Rex', photoUrls: [] }), ...handlers)

const pet = createPet({ name: 'Rex' })
```

:::

`handlers` holds every operation, where orval has one list per tag. [Mock API responses](/extensions/kubb-labs/plugin-msw/guides/mock-api) has more.

## Remove orval

Once nothing imports from `src/api`, delete `src/api` and `orval.config.ts`, and uninstall `orval`. Keep only `kubb generate` in your `generate` script:

:::code-group

```json [During the move]
{
  "scripts": {
    "generate": "orval && kubb generate"
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

::
