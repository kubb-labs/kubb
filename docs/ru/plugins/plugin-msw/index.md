---
layout: doc

title: \@kubb/plugin-msw
outline: deep
---

# @kubb/plugin-msw

С помощью плагина MSW вы можете использовать [MSW](https://mswjs.io/) для создания моков API.

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/plugin-msw
```

```shell [pnpm]
pnpm add -D @kubb/plugin-msw
```

```shell [npm]
npm install --save-dev @kubb/plugin-msw
```

```shell [yarn]
yarn add -D @kubb/plugin-msw
```

:::

## Опции

### output
Указывает местоположение экспорта файлов и определяет поведение вывода.

#### output.path

Путь к выходной папке или файлу, который будет содержать сгенерированный код.

> [!TIP]
> если `output.path` является файлом, `group` не может быть использован.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'handlers'` |

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

### handlers
Создает файл `handlers.ts` со всеми обработчиками, сгруппированными по методам.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### contentType
<!--@include: ../core/contentType.md-->

### baseURL
<!--@include: ../plugin-client/baseURL.md-->

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

### parser
Какой парсер должен использоваться перед возвратом данных в `Response` MSW.

|           |                     |
|----------:|:--------------------|
|     Type: | `'data' \| 'faker'` |
| Required: | `false`             |
|  Default: | `'data'`            |

- `'faker'` будет использовать `@kubb/plugin-faker` для генерации данных для ответа.
- `'data'` будет использовать ваши пользовательские данные для генерации данных для ответа.

### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                               |
|----------:|:------------------------------|
|     Type: | `Array<Generator<PluginMsw>>` |
| Required: | `false`                       |


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

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginMsw} from '@kubb/plugin-msw'
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
    pluginMsw({
      output: {
        path: './mocks',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
        footer: ''
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Service`,
      },
      handlers: true
    }),
  ],
})
```
## Ссылки

- [MSW](https://mswjs.io/)
