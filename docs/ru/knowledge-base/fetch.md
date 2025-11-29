---
layout: doc

title: Пользовательский HTTP-клиент
outline: deep
---

# Использование Fetch <a href="/plugins/plugin-client"><Badge type="info" text="@kubb/plugin-client" /></a>
По умолчанию `@kubb/plugin-client` использует импорт клиента из `@kubb/plugin-client/clients/axios` в качестве своего клиента, который основан на интерфейсе экземпляра Axios для выполнения вызовов API.

Однако бывают случаи, когда вы можете захотеть настроить клиент. Например, вы можете предпочесть использовать [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) или [Ky](https://github.com/sindresorhus/ky).

## Создайте `kubb.config.ts` со следующей конфигурацией
`importPath` может быть относительным путем, алиасом импорта или импортом из другой библиотеки (по умолчанию будет использоваться `@kubb/plugin-client/clients/axios`).

См. [plugins/plugin-client](/plugins/plugin-client/#client).
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

## Добавьте `client.ts` со следующей конфигурацией
В фоновом режиме каждый запрос POST, PUT, GET, PATCH и DELETE будет использовать **importPath** и вызывать экспорт по умолчанию этого файла с конфигурацией, имеющей форму `RequestConfig`, которая смоделирована по интерфейсу/конфигурации AxiosRequest.

> [!IMPORTANT]
> Клиент всегда должен возвращать объект в форме `ResponseConfig`, даже если вы изменили `dataReturnType` с помощью `dataReturnType: 'data'`.

```typescript client.ts
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

## Просмотр сгенерированного кода
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


## Пример
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
