---
layout: doc

title: Use of your own baseURL
outline: deep
---

# Use of your own baseURL <a href="/plugins/plugin-client"><Badge type="info" text="@kubb/plugin-client" /></a>

In Kubb, there are multiple ways to specify a baseURL. Set it with a custom client, using the serverIndex of your Swagger/OpenAPI spec file, or using the `baseURL` config.

## Use custom client
When [defining your own client](/guide/fetch), set a baseURL that applies to every HTTP call.

::: code-group
```typescript [client.ts]
import axios from 'axios'

import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  params?: unknown
  data?: TData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}
/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export const axiosInstance = axios.create({
  baseURL: 'https://localhost:8080/api/v1' // [!code ++]
})

export const client = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const promise = axiosInstance.request<TVariables, ResponseConfig<TData>>({ ...config }).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

```
```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient({
      importPath: '../../client.ts' // [!code ++]
    }),
  ],
})
```
:::

## Use serverIndex
Reuse the server URL from your Swagger/OpenAPI spec file by defining [which index](/plugins/plugin-oas/#serverindex) to use.

:::code-group
```yaml [OpenAPI]
openapi: 3.0.3
info:
  title: Swagger Example
  description:
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.0
servers:
- url: http://petstore.swagger.io/api
- url: http://localhost:3000
```
```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      serverIndex: 0, // [!code ++]
    }),
    pluginClient(),
  ],
})
```
:::

## Use baseURL
Set the baseURL in your config.

:::code-group
```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      baseURL: 'https://localhost:8080/api/v1' // [!code ++]
    }),
    pluginReactQuery({
      client: {
        baseURL: 'https://localhost:8080/api/v1' // [!code ++]
      }
    }),
  ],
})
```
:::
