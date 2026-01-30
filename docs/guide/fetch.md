---
layout: doc

title: Kubb Fetch Client Guide - Native Fetch API
description: Use Kubb's Fetch client for native browser API calls. Configuration, TypeScript types, and request/response handling.
outline: deep
---

# Use of Fetch <a href="/plugins/plugin-client"><Badge type="info" text="@kubb/plugin-client" /></a>
By default, `@kubb/plugin-client` uses the Axios client from `@kubb/plugin-client/templates/axios`, which is based on the Axios instance interface.

In some cases, you may want a custom client. For example, use [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) or [Ky](https://github.com/sindresorhus/ky).

## Create `kubb.config.ts`
Set `importPath` to a relative path, import alias, or library (default: `@kubb/plugin-client/templates/axios`).

See [plugins/plugin-client](/plugins/plugin-client/#client).
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
        generators: [],
      }),
      pluginTs({
        output: { path: 'models.ts' },
      }),
      pluginClient({
        output: {
          path: '.',
        },
        importPath: '../client.ts', // [!code ++]
      }),
    ],
  }
})

```

## Add `client.ts`
Every POST, PUT, GET, PATCH, and DELETE request uses the **importPath** and invokes the default export with a configuration shaped by `RequestConfig`, modeled after the AxiosRequest interface/config.

> [!IMPORTANT]
> The client must return an object in the shape of `ResponseConfig`, even if you change `dataReturnType` with `dataReturnType: 'data'`.

```typescript [client.ts]
export type RequestConfig<TData = unknown> = {
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  params?: object
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: HeadersInit
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
}

export const client = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
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
```

## View generated code
```typescript [src/gen/models.ts]
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
