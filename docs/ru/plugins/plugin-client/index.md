---
layout: doc

title: \@kubb/plugin-client
outline: deep
---

# @kubb/plugin-client

Плагин Client позволяет генерировать контроллеры API, упрощая процесс обработки API-запросов и улучшая интеграцию между фронтенд и бэкенд сервисами.

По умолчанию мы используем [Axios](https://axios-http.com/docs/intro), но вы также можете добавить свой собственный клиент, см. [Use of Fetch](/ru/knowledge-base/fetch).

## Установка

::: code-group
```shell [bun]
bun add -d @kubb/plugin-client
```

```shell [pnpm]
pnpm add -D @kubb/plugin-client
```

```shell [npm]
npm install --save-dev @kubb/plugin-client
```

```shell [yarn]
yarn add -D @kubb/plugin-client
```
:::

## Опции

### output
Указывает местоположение экспорта файлов и определяет поведение вывода.

#### output.path

Путь к выходной папке или файлу, который будет содержать сгенерированный код.

> [!TIP]
> если `output.path` является файлом, `group` не может быть использован.

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'clients'` |

#### output.barrelType

Определяет, что нужно экспортировать, здесь вы также можете отключить экспорт barrel-файлов.

> [!TIP]
> использование propagate предотвратит создание barrel-файла плагином, но он всё равно будет распространяться, позволяя [`output.barrelType`](/ru/getting-started/configure#output-barreltype) экспортировать конкретную функцию или тип.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Добавляет текст баннера в начало каждого файла.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Добавляет текст футера в конец каждого файла.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### contentType
<!--@include: ../core/contentType.md-->

### group
<!--@include: ../core/group.md-->

#### group.type
Определяет тип, по которому нужно группировать файлы.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Возвращает имя группы на основе имени группы, это будет использоваться для генерации имени файла и имени.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### importPath
<!--@include: ../plugin-client/importPath.md-->

### operations
Создает файл `operations.ts` со всеми операциями, сгруппированными по методам.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

### urlType
Экспортирует URL-адреса, которые используются операцией x

|           |                     |
|----------:|:--------------------|
|     Type: | `'export' \| false` |
| Required: | `false`             |
|  Default: | `false`             |

- `'export'` сделает их частью вашего barrel-файла
- `false` не сделает их экспортируемыми

```typescript
export function getGetPetByIdUrl(petId: GetPetByIdPathParams['petId']) {
  return `/pet/${petId}` as const
}
```

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ../plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

### client
<!--@include: ../plugin-client/client.md-->

### baseURL
<!--@include: ../plugin-client/baseURL.md-->

### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                                                                              |
|----------:|:-----------------------------------------------------------------------------|
|     Type: | `Array<Generator<PluginClient>>`                                             |
| Required: | `false`                                                                      |


### transformers
<!--@include: ../core/transformers.md-->

#### transformers.name
Настраивает имена на основе типа, предоставленного плагином.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```

## Пример

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
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
    pluginTs(),
    pluginClient({
      output: {
        path: './clients/axios',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
        footer: ''
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Service`,
      },
      transformers: {
        name: (name, type) => {
          return `${name}Client`
        },
      },
      operations: true,
      parser: 'client',
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      pathParamsType: "object",
      dataReturnType: 'full',
      client: 'axios'
    }),
  ],
})
```

## Ссылки

- [Axios](https://axios-http.com/docs/intro)
