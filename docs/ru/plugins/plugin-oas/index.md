---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# @kubb/plugin-oas


## Установка
::: code-group

```shell [bun]
bun add -d @kubb/plugin-oas
```

```shell [pnpm]
pnpm add -D @kubb/plugin-oas
```

```shell [npm]
npm install --save-dev @kubb/plugin-oas
```

```shell [yarn]
yarn add -D @kubb/plugin-oas
```
:::

## Опции

### output
Укажите место экспорта для файлов и определите поведение вывода.

#### output.path
Путь к выходной папке или файлу, который будет содержать сгенерированный код.

> [!TIP]
> если `output.path` является файлом, `group` не может использоваться.

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'schemas'` |

#### output.barrelType

Определяет, что необходимо экспортировать, здесь вы также можете отключить экспорт barrel-файлов.

> [!TIP]
> Использование propagate предотвратит создание плагином barrel-файла, но он все равно будет распространяться, позволяя [`output.barrelType`](/ru/getting-started/configure#output-barreltype) экспортировать конкретную функцию или тип.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Добавьте текст баннера в начало каждого файла.

|           |                                  |
|----------:|:---------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer
Добавьте текст футера в конец каждого файла.

|           |         |
|----------:|:--------|
|     Type: | `string \| (oas: Oas) => string`        |
| Required: | `false` |


### group
<!--@include: ../core/group.md-->

#### group.type
Определите тип, по которому группировать файлы.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Возвращает имя группы на основе названия группы, это будет использоваться для генерации файла и имени.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### validate

Проверьте ваш [`input`](/ru/getting-started/configure#input) на основе `@readme/openapi-parser`.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

### serverIndex

Какой сервер использовать из массива `servers.url[serverIndex]`

> [!TIP]
> Определение сервера здесь позволит использовать этот endpoint как `baseURL` в других плагинах.

|           |          |
|----------:|:---------|
|     Type: | `number` |
| Required: | `false`  |

- `0` вернет `http://petstore.swagger.io/api`
- `1` вернет `http://localhost:3000`

::: code-group

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

```typescript [serverIndex 0]
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 0 })
```

```typescript [serverIndex 1]
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 1 })
```
:::

### discriminator

Определяет, как значение discriminator должно интерпретироваться во время обработки.
Это было упомянуто в [issues/1736](https://github.com/kubb-labs/kubb/issues/1736).


|           |                          |
|----------:|:-------------------------|
|     Type: | ` 'strict' \| 'inherit'` |
| Required: | `'strict'`                 |

- `'inherit'` заменяет схему `oneOf` схемой, на которую ссылается `discriminator.mapping[key]`.
- `'strict'` использует схемы `oneOf` как определено, без изменений.

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
components:
  schemas:
    Animal:
    title: Animal
    required:
      - type
    type: object
    oneOf:
      - $ref: "#/components/schemas/Cat"
      - $ref: "#/components/schemas/Dog"
    properties:
      type:
        type: string
        enum:
          - cat
          - dog
    discriminator:
      propertyName: type
      mapping:
        cat: "#/components/schemas/Cat"
        dog: "#/components/schemas/Dog"

    Cat:
      title: Cat
      type: object
      required:
        - indoor
        - type
      properties:
        type:
          type: string
        name:
          type: string
        indoor:
          type: boolean

    Dog:
      title: Dog
      type: object
      required:
        - name
        - type
      properties:
        type:
          type: string
        name:
          type: string
```

```typescript [discriminator 'strict']
export type Cat = {
  type: string
  name?: string
  indoor: boolean
}

export type Dog = {
  type: string
  name: string
}

export type Animal =
  | (Cat & {
  type: 'cat'
})
  | (Dog & {
  type: 'dog'
})
```

```typescript [discriminator 'inherit']
export const catTypeEnum = {
  cat: 'cat',
} as const

export type CatTypeEnum = (typeof catTypeEnum)[keyof typeof catTypeEnum]
export type Cat = {
  type: CatTypeEnum
  name?: string
  indoor: boolean
}

export const dogTypeEnum = {
  dog: 'dog',
} as const

export type DogTypeEnum = (typeof dogTypeEnum)[keyof typeof dogTypeEnum]
export type Dog = {
  type: DogTypeEnum
  name: string
}

export type Animal =
  | (Cat & {
  type: 'cat'
})
  | (Dog & {
  type: 'dog'
})
```

:::

### contentType
<!--@include: ../core/contentType.md-->

### oasClass <img src="/icons/experimental.svg"/>
Переопределите некоторое поведение экземпляра класса Oas, см. `@kubb/oas`.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `typeof Oas`                             |
| Required: | `false`                        |


### generators <img src="/icons/experimental.svg"/>
Определите некоторые генераторы для создания файлов на основе операции и/или схемы. Все плагины используют генераторы для создания файлов на основе OperationGenerator и SchemaGenerators. Пустой массив приведет к тому, что схемы не будут сгенерированы, в v2 Kubb мы использовали `output: false`.

См. [Генераторы](/ru/knowledge-base/generators) для получения дополнительной информации о том, как использовать генераторы.

::: info

```typescript
import { pluginOas, createGenerator, PluginOas } from '@kubb/plugin-oas'
import { jsonGenerator } from '@kubb/plugin-oas/generators';

export const customGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, name, instance }) {
    return []
  }
})

const plugin = pluginOas({
  generators: [jsonGenerator,  customGenerator]
})
```
:::

## Пример

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      validate: true,
      output: {
        path: './json',
      },
      serverIndex: 0,
      contentType: 'application/json',
    }),
  ],
})
```

## Ссылки

- [Oas](https://github.com/readmeio/oas)
