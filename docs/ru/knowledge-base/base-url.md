---
layout: doc

title: Использование собственного baseURL
outline: deep
---

# Использование собственного baseURL <a href="/plugins/plugin-client"><Badge type="info" text="@kubb/plugin-client" /></a>

В Kubb существует несколько способов указать baseURL. Это можно сделать с помощью пользовательского клиента, используя serverIndex из вашего файла спецификации Swagger/OpenAPI или используя конфигурацию `baseURL`.

## Использование пользовательского клиента
При [определении собственного клиента](/ru/knowledge-base/fetch) вы также можете установить baseURL, который будет использоваться в каждом HTTP-вызове.

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
    pluginOas(),
    pluginClient({
      importPath: './client.ts' // [!code ++]
    }),
  ],
})
```
:::

## Использование serverIndex
Повторное использование URL сервера, который был установлен как часть вашего файла спецификации Swagger/OpenAPI, для этого вы можете определить [какой индекс](/plugins/plugin-oas/#serverindex) следует использовать.

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

## Использование baseURL
Установите baseURL, который должен использоваться в вашей конфигурации.

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
