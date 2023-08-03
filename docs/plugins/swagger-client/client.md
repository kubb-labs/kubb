---
layout: doc

title: Client
outline: deep
---

# Client <Badge type="warning" text="beta" />

## Features

- Client that is using 'axios' behind the scenes to do REST calls
- Override with your own implementation

### Default `client`

By default `@kubb/swagger-client/client` is getting used as the [`client`](http://localhost:3000/plugins/swagger-client/client#default-client).

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'

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
      createSwagger({ output: false }),
      createSwaggerClient({ 
        output: './clients/axios' // [!code ++]
      })
    ],
  }
})
```

```typescript [./src/gen/clients/axios/client.ts]
import axios from 'axios'

import type { AxiosError } from 'axios'

export type RequestConfig<TVariables = unknown> = {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  url: string
  params?: unknown
  data?: TVariables
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

export const axiosInstance = axios.create({
  baseURL: 'https://petstore3.swagger.io/api/v3' // [!code ++]
  headers: '{}' ? JSON.parse('{}') : {}, // [!code ++]
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<TData> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default axiosClient
```

```typescript [./src/gen/clients/axios/addPet.ts]
import client from './client' // [!code ++]
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/AddPet' // [!code ++]

/** // [!code ++]
 * @description Add a new pet to the store // [!code ++]
 * @summary Add a new pet to the store // [!code ++]
 * @link /pet // [!code ++]
 */ // [!code ++]
export function addPet<TData = AddPetMutationResponse, TVariables = AddPetMutationRequest>(data: TVariables) { // [!code ++]
  return client<TData, TVariables>({ // [!code ++]
    method: 'post', // [!code ++]
    url: `/pet`, // [!code ++]
    data, // [!code ++]
  }) // [!code ++]
} // [!code ++]
```

:::

### Custom `client`

Create your own implementation of the `client`.
Handy when you want for examples to use `fetch` instead of `axios`.

You can start with using a copy paste of `@kubb/swagger-client/client`.

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'

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
      createSwagger({ 
        output: false 
      }),
      createSwaggerClient({ 
        output: './clients/axios', // [!code ++]
        // copy paste of @kubb/swagger-client/client 
        client: './src/client.ts' // [!code ++]
      })
    ],
  }
})
```

```typescript [./src/gen/axios/client.ts]
import axios from 'axios'

import type { AxiosError } from 'axios'

export type RequestConfig<TVariables = unknown> = {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  url: string
  params?: unknown
  data?: TVariables
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

export const axiosInstance = axios.create({
  baseURL: 'https://petstore3.swagger.io/api/v3', // [!code ++]
  headers: '{}' ? JSON.parse('{}') : {}, // [!code ++]
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<TData> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default axiosClient
```

```typescript [./src/gen/clients/axios/addPet.ts]
import client from './client' // [!code ++]
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/AddPet' // [!code ++]

/** // [!code ++]
 * @description Add a new pet to the store // [!code ++]
 * @summary Add a new pet to the store // [!code ++]
 * @link /pet // [!code ++]
 */
export function addPet<TData = AddPetMutationResponse, TVariables = AddPetMutationRequest>(data: TVariables) { // [!code ++]
  return client<TData, TVariables>({ // [!code ++]
    method: 'post', // [!code ++]
    url: `/pet`, // [!code ++]
    data, // [!code ++]
  }) // [!code ++]
} // [!code ++]
```
:::

## Usage

### Default `client` with `process.env`

Link: [`client.ts`](https://github.com/kubb-project/kubb/blob/main/packages/swagger-client/client.ts)

```typescript
import axios from 'axios'

import type { AxiosError } from 'axios'

export type RequestConfig<TVariables = unknown> = {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  url: string
  params?: unknown
  data?: TVariables
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

export const axiosInstance = axios.create({
  baseURL: process.env['AXIOS_BASE'],
  headers: process.env['AXIOS_HEADERS'] ? JSON.parse(process.env['AXIOS_HEADERS']) : {},
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<TData> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default axiosClient
```


### Default `client` with `declare const`

Link: [`client.ts`](https://github.com/kubb-project/kubb/blob/main/packages/swagger-client/client.ts)

```typescript
import axios from 'axios'

import type { AxiosError, AxiosHeaders } from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

export type RequestConfig<TVariables = unknown> = {
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  url: string
  params?: unknown
  data?: TVariables
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
}

export const axiosInstance = axios.create({
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders) : undefined,
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<TData> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default axiosClient
```

## Links
- [plugins/core/fileManager#getenveource](/plugins/core/fileManager#getenveource)