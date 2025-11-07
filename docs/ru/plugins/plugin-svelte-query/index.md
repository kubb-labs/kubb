---
layout: doc

title: \@kubb/plugin-svelte-query
outline: deep
---

# @kubb/plugin-svelte-query

Создание примитивов на основе операции.

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/plugin-svelte-query
```

```shell [pnpm]
pnpm add -D @kubb/plugin-svelte-query
```

```shell [npm]
npm install --save-dev @kubb/plugin-svelte-query
```

```shell [yarn]
yarn add -D @kubb/plugin-svelte-query
```

:::

## Опции

### output
Укажите расположение экспорта файлов и определите поведение вывода.

#### output.path

Путь к выходной папке или файлу, который будет содержать сгенерированный код.

> [!TIP]
> если `output.path` является файлом, `group` не может использоваться.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'hooks'` |

#### output.barrelType

Определите, что необходимо экспортировать, здесь вы также можете отключить экспорт barrel файлов.

> [!TIP]
> Использование propagate предотвратит создание barrel файла плагином, но он все равно будет распространяться, позволяя [`output.barrelType`](/ru/getting-started/configure#output-barreltype) экспортировать конкретную функцию или тип.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Добавьте текст баннера в начало каждого файла.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Добавьте текст футера в конец каждого файла.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### contentType
<!--@include: ../core/contentType.md-->

### group
<!--@include: ../core/group.md-->

#### group.type
Определите тип, по которому группируются файлы.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Возвращает имя группы на основе имени группы, это будет использоваться для генерации файла и имени.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### client

#### client.importPath
<!--@include: ../plugin-client/importPath.md-->

#### client.dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

#### client.baseURL
<!--@include: ../plugin-client/baseURL.md-->

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ../plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

#### queryKey

Настройте queryKey.

::: warning
При использовании строки необходимо использовать `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |

### query

Переопределите некоторые поведения useQuery. <br/>
Чтобы отключить создание хуков, передайте `false`, это приведет к созданию только `queryOptions`.

|           |         |
|----------:|:--------|
|     Type: | `Query` |
| Required: | `false` |

```typescript [Query]
type Query = {
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### query.methods

Определите, какие HttpMethods могут использоваться для запросов

|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `['get']`           |


#### query.importPath

Путь к useQuery, который будет использоваться для выполнения функциональности useQuery.
Будет использоваться как `import { useQuery } from '${hook.importPath}'`.
Разрешен как относительный, так и абсолютный путь.
Путь будет применен как есть, поэтому относительный путь должен основываться на генерируемом файле.

|           |                            |
|----------:|:---------------------------|
|     Type: | `string`                   |
| Required: | `false`                    |
|  Default: | `'@tanstack/svelte-query'` |

#### mutationKey

Настройте mutationKey.

::: warning
При использовании строки необходимо использовать `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |

### mutation

Переопределите некоторые поведения useMutation. <br/>
Чтобы отключить запросы, передайте `false`.

|           |            |
|----------:|:-----------|
|     Type: | `Mutation` |
| Required: | `false`    |

```typescript [Query]
type Mutation = {
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### mutation.methods

Определите, какие HttpMethods могут использоваться для мутаций

|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `['get']`           |


#### mutation.importPath

Путь к useQuery, который будет использоваться для выполнения функциональности useQuery.
Будет использоваться как `import { useMutation } from '${hook.importPath}'`.
Разрешен как относительный, так и абсолютный путь.
Путь будет применен как есть, поэтому относительный путь должен основываться на генерируемом файле.

|           |                            |
|----------:|:---------------------------|
|     Type: | `string`                   |
| Required: | `false`                    |
|  Default: | `'@tanstack/svelte-query'` |


### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `Array<Generator<PluginSvelteQuery>>` |
| Required: | `false`                               |


### transformers
<!--@include: ../core/transformers.md-->

#### transformers.name
Настройте имена на основе типа, предоставляемого плагином.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```

## Пример

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query'
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
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Hooks`,
      },
      client: {
        dataReturnType: 'full',
      },
      mutation: {
        methods: [ 'post', 'put', 'delete' ],
      },
      query: {
        methods: [ 'get' ],
        importPath: "@tanstack/svelte-query"
      },
    }),
  ],
})
```

## Ссылки

- [Tanstack Query](https://tanstack.com/query)
