---
layout: doc

title: Use of Fetch
outline: deep
---

# Use of Fetch
By default, `@kubb/plugin-client` uses the import client from `@kubb/plugin-client/client` as its client, which is based on the Axios instance interface for making API calls.

However, there are cases where you might want to customize the client. For example, you might prefer to use [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) or [Ky](https://github.com/sindresorhus/ky).

## Create a `kubb.config.ts` with the following config
`client.importPath` can be a relative, import alias, or an import to another library(default `@kubb/plugin-client/client` will be used).

See [plugins/plugin-client](/documentation/plugins/plugin-client/#client).
```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({
        validate: false,
        output: false,
      }),
      pluginTs({
        output: { path: 'models.ts' },
      }),
      pluginClient({
        output: {
          path: '.',
        },
        client: {
          importPath: '../client.ts', // [!code ++]
        },
      }),
    ],
  }
})

```

## Add `client.ts` with the following config
In the background, every POST, PUT, GET, PATCH, and DELETE request will utilize the **importPath** and invoke the default export of that file with a configuration shaped by RequestConfig, which is modeled after the AxiosRequest interface/config.

```typescript client.ts
export type RequestConfig<TData = unknown> = {
  url?: string
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  params?: object
  data?: TData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: HeadersInit
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
}

export const fetchClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const response = await fetch('https://example.org/post', {
    method: config.method.toUpperCase(),
    body: JSON.stringify(config.data),
    signal: config.signal,
    headers: config.headers,
  })

  const data = await response.json()

  return {
    data,
    status: response.status,
    statusText: response.statusText,
  }
}

export default fetchClient

```

## View the generated code
```typescript
import client from '../client.ts'
import type { ResponseConfig } from '../client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams } from './models.ts'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export async function getPetById(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<GetPetByIdQueryResponse>['data']> {
  const res = await client<GetPetByIdQueryResponse>({ method: 'get', url: `/pet/${petId}`, ...options })
  return res.data
}

```


## Example
<iframe
src="https://codesandbox.io/embed/github/kubb-labs/kubb/tree/main/examples/fetch?fontsize=14&module=%2Fsrc%2Fgen%2Fmodels%2FPerson.ts&theme=dark&view=editor"
:style="{
width: '100%',
height: '700px',
border: 0,
borderRadius: '4px',
overflow: 'hidden'
}"
title="Client"
allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>
