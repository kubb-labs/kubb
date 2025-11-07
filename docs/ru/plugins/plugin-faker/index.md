---
layout: doc

title: \@kubb/plugin-faker
outline: deep
---

# @kubb/plugin-faker

С помощью плагина Faker вы можете использовать [Faker](https://fakerjs.dev/) для создания моков.

## Установка

::: code-group

```shell [bun]
bun add -d @kubb/plugin-faker
```

```shell [pnpm]
pnpm add -D @kubb/plugin-faker
```

```shell [npm]
npm install --save-dev @kubb/plugin-faker
```

```shell [yarn]
yarn add -D @kubb/plugin-faker
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
|  Default: | `'mocks'` |

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

### dateType

Выберите использование `date` или `datetime` как JavaScript `Date` вместо `string`.

|           |                      |
|----------:|:---------------------|
|     Type: | `'string' \| 'date'` |
| Required: | `false`              |
|  Default: | `'string'`           |

::: code-group
```typescript ['string']
faker.date.anytime().toISOString()
```

```typescript ['date']
faker.date.anytime()
```
:::

### dateParser

Какой парсер должен использоваться, когда dateType установлен в 'string'.

|           |                                            |
|----------:|:-------------------------------------------|
|     Type: | `'faker' \| 'dayjs' \| 'moment' \| string` |
| Required: | `false`                                    |
|  Default: | `'faker'`                                  |

> [!TIP]
> вы можете использовать любую другую библиотеку. Например, когда вы хотите использовать `moment`, вы можете передать `moment` и Kubb добавит импорт для moment: `import moment from 'moment'`.
> это работает только когда пакет использует экспорт по умолчанию, как Dayjs и Moment.

::: code-group

```typescript [undefined]
// схема с форматом, установленным в 'date'
faker.date.anytime().toISOString().substring(0, 10)

// схема с форматом, установленным в 'time'
faker.date.anytime().toISOString().substring(11, 19)

```

```typescript ['dayjs']
// схема с форматом, установленным в 'date'
dayjs(faker.date.anytime()).format("YYYY-MM-DD")

// схема с форматом, установленным в 'time'
dayjs(faker.date.anytime()).format("HH:mm:ss")

```

```typescript ['moment']
// схема с форматом, установленным в 'date'
moment(faker.date.anytime()).format("YYYY-MM-DD")

// схема с форматом, установленным в 'time'
moment(faker.date.anytime()).format("HH:mm:ss")
```
:::

### mapper

|           |           |
|----------:|:----------|
|     Type: | `Record<string, string>` |
| Required: | `false`   |


### unknownType
Какой тип использовать, когда файл Swagger/OpenAPI не предоставляет больше информации.

|           |                               |
|----------:|:------------------------------|
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                       |
|  Default: | `'any'`                       |


### emptySchemaType

Какой тип использовать для пустых значений схемы.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `unknownType`                  |


### regexGenerator

Выберите, какой генератор использовать при использовании Regexp.


|           |                        |
|----------:|:-----------------------|
|     Type: | `'faker' \| 'randexp'` |
| Required: | `false`                |
|  Default: | `'faker'`                |

::: code-group
```typescript ['faker']
faker.helpers.fromRegExp(new RegExp(/test/))
```

```typescript ['randexp']
new RandExp(/test/).gen()
```
:::


### seed
Использование Seed предназначено для получения согласованных значений в тесте.

|           |         |
|----------:|:--------|
|     Type: | `number | number[]` |
| Required: | `false` |


### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `Array<Generator<PluginFaker>>` |
| Required: | `false`                         |


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
import { pluginFaker} from '@kubb/plugin-faker'
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
    pluginFaker({
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
      dateType: 'date',
      unknownType: 'unknown',
      seed: [100],
    }),
  ],
})
```
## Ссылки

- [Faker](https://fakerjs.dev/)
