---
layout: doc

title: \@kubb/plugin-ts
outline: deep
---

# @kubb/plugin-ts

С помощью плагина TypeScript вы можете создавать типы [TypeScript](https://www.typescriptlang.org/).

## Установка
::: code-group

```shell [bun]
bun add -d @kubb/plugin-ts
```

```shell [pnpm]
pnpm add -D @kubb/plugin-ts
```

```shell [npm]
npm install --save-dev @kubb/plugin-ts
```

```shell [yarn]
yarn add -D @kubb/plugin-ts
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
|  Default: | `'types'` |

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

### enumType

Выбор между использованием `enum` или `as const` для перечислений.

|           |                                                                      |
|----------:|:---------------------------------------------------------------------|
|     Type: | `'enum' \| 'asConst' \| 'asPascalConst' \| 'constEnum' \| 'literal'` |
| Required: | `false`                                                              |
|  Default: | `'asConst'`                                                               |

::: code-group

```typescript ['enum']
enum PetType {
  Dog = 'dog',
  Cat = 'cat',
}
```

```typescript ['asConst']
const petType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
```

```typescript ['asPascalConst']
const PetType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
```

```typescript ['constEnum']
const enum PetType {
  Dog = 'dog',
  Cat = 'cat',
}
```

```typescript ['literal']
type PetType = 'dog' | 'cat'
```
:::

### enumSuffix
Устанавливает суффикс для сгенерированных перечислений.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'enum'` |

### dateType
Выбор между использованием `date` или `datetime` как JavaScript `Date` вместо `string`.

|           |                      |
|----------:|:---------------------|
|     Type: | `'string' \| 'date'` |
| Required: | `false`              |
|  Default: | `'string'`           |

::: code-group

```typescript ['string']
type Pet = {
  date: string
}
```

```typescript ['date']
type Pet = {
  date: Date
}
```
:::

### syntaxType

Переключение между type или interface для создания типов TypeScript.
См. [Type vs Interface: Which Should You Use](https://www.totaltypescript.com/type-vs-interface-which-should-you-use).

|           |                         |
|----------:|:------------------------|
|     Type: | `'type' \| 'interface'` |
| Required: | `false`                 |
|  Default: | `'type'`                |

::: code-group

```typescript ['type']
type Pet = {
  name: string
}
```

```typescript ['interface']
interface Pet {
  name: string
}
```
:::

### unknownType

Какой тип использовать, когда файл Swagger/OpenAPI не предоставляет больше информации.

|           |                               |
|----------:|:------------------------------|
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                       |
|  Default: | `'any'`                       |

::: code-group

```typescript ['any']
type Pet = {
  name: any
}
```

```typescript ['unknown']
type Pet = {
  name: unknown
}
```

```typescript ['void']
type Pet = {
  name: void
}
```
:::

### emptySchemaType

Какой тип использовать для значений пустой схемы.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `'any' \| 'unknown' \| 'void'` |
| Required: | `false`                        |
|  Default: | `unknownType`                  |

::: code-group

```typescript ['any']
type Pet = {
  name: any
}
```

```typescript ['unknown']
type Pet = {
  name: unknown
}
```

```typescript ['void']
type Pet = {
  name: void
}
```
:::

### optionalType
Выбор того, что использовать в качестве режима для необязательного значения.

|           |                                                                 |
|----------:|:----------------------------------------------------------------|
|     Type: | `'questionToken' \| 'undefined' \| 'questionTokenAndUndefined'` |
| Required: | `false`                                                         |
|  Default: | `'questionToken'`                                                            |

::: code-group
```typescript ['questionToken']
type Pet = {
  type?: string
}
```

```typescript ['undefined']
type Pet = {
  type: string | undefined
}
```

```typescript ['questionTokenAndUndefined']
type Pet = {
  type?: string | undefined
}
```
:::

### oasType

Экспорт объекта Oas как типа Oas с `import type { Infer } from '@kubb/plugin-ts/oas'` <br/>
См. [infer](/ru/helpers/oas) как использовать типы с `@kubb/plugin-ts/oas`.<br/>

|           |                    |
|----------:|:-------------------|
|     Type: | `'infer' \| false` |
| Required: | `false`            |


### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->


### override
<!--@include: ../core/override.md-->


### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                              |
|----------:|:-----------------------------|
|     Type: | `Array<Generator<PluginTs>>` |
| Required: | `false`                      |


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
    pluginTs({
      output: {
        path: './types',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Controller`
      },
      enumType: "asConst",
      enumSuffix: 'Enum',
      dateType: 'date',
      unknownType: 'unknown',
      optionalType: 'questionTokenAndUndefined',
      oasType: false,
    }),
  ],
})
```

## Ссылки

- [TypeScript](https://www.typescriptlang.org/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
