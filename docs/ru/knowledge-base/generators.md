---
layout: doc

title: Генераторы
outline: deep
---

# Генераторы <a href="/plugins/plugin-oas"><Badge type="info" text="@kubb/plugin-oas" /></a>

В Kubb генераторы - это функции, которые позволяют разработчикам подключаться к процессу генерации файлов фреймворка для автоматического создания, изменения или расширения кода.
Генераторы являются центральными в рабочем процессе Kubb, обеспечивая автоматическую генерацию кода, такого как клиенты API, хуки React-Query, типы TypeScript или другие файлы на основе конкретного ввода (спецификации Swagger и OpenAPI).

Допустим, вы хотите добавить дополнительный код после сгенерированного клиента с помощью [`@kubb/plugin-client`](/plugins/plugin-client#generators), для этого вы можете либо:
- Использовать опцию [`footer`](/plugins/plugin-client/#output-footer)
- Переопределить генератор по умолчанию `@kubb/plugin-client`

> [!TIP]
> Каждый плагин имеет опцию `generators`, но для самой базовой генерации вы можете использовать [`plugin-oas`](/plugins/plugin-oas#generators).

Генераторы могут использоваться с нашим [React](/helpers/react/) рендерером или определить собственный рендерер и вернуть массив KubbFiles.


## createGenerator

> [!TIP]
> - `operations`, `operation` и `schema` - все это промисы, где вам нужно вернуть массив KubbFiles.
> - Вы можете использовать `this` для доступа к [`name`](#name) или любому другому свойству, которое является частью генератора.


::: code-group
```typescript [createGenerator]
export function createGenerator(parseOptions: GeneratorOptions): Generator {
  return parseOptions
}
```
```typescript [Generator]
export type Generator = GeneratorOptions
```
```typescript [GeneratorOptions]
export type Generator = {
  name: string
  operations?: (this: GeneratorOptions, props: OperationsProps) => Promise<KubbFile.File[]>
  operation?: (this: GeneratorOptions, props: OperationProps) => Promise<KubbFile.File[]>
  schema?: (this: GeneratorOptions, props: SchemaProps) => Promise<KubbFile.File[]>
}
```
:::

### name
Определите имя, которое можно использовать для идентификации вашего генератора.

|           |           |
|----------:|:----------|
|     Тип: | `string`  |
| Обязательно: | `true`    |

### operations
Эта **функция** будет вызвана со всеми операциями, которые доступны в вашем файле Swagger/OpenAPI.

|           |          |
|----------:|:---------|
|     Тип: | `(this: GeneratorOptions, props: OperationsProps) => Promise<KubbFile.File[]>` |
| Обязательно: | `false`  |


Следующие свойства будут доступны при вызове `operations`:

|               Свойство | Описание                                                                                            | Тип                                                                          |
|-----------------------:|--------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------|
|             `instance` | Экземпляр `OperationsGenerator`, этот класс можно использовать для полного контроля над экземпляром Oas. | ` Omit<OperationGenerator, 'build'>`                                          |
|              `options` | Разрешенные опции из конкретного плагина.                                                           | `object`                                                                      |
|           `operations` | Все операции Oas.                                                                                    | `Array<Operation>` |
|   `operationsByMethod` | Объект, сгруппированный по `HttpMethod` и объект со значением `{ operation, schemas }`.        | `OperationsByMethod`    |


### operation
Эта **функция** будет вызвана с одной операцией на основе вашего файла Swagger/OpenAPI.
`operation` почти то же самое, что и [operations](#operations) с одним незначительным отличием - `operation` будет вызван x раз (в зависимости от массива операций).

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Тип: | `(this: GeneratorOptions, props: OperationProps) => Promise<KubbFile.File[]>` |
| Обязательно: | `false`                                                                       |


Следующие свойства будут доступны при вызове `operation`:

|               Свойство | Описание                                                                                            | Тип                                                                         |
|-----------------------:|--------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------|
|             `instance` | Экземпляр `OperationsGenerator`, этот класс можно использовать для полного контроля над экземпляром Oas. | ` Omit<OperationGenerator, 'build'>`                                         |
|              `options` | Разрешенные опции из конкретного плагина.                                                           | `object`                                                                     |
|            `operation` | Одна операция Oas.                                                                                     | `Operation` |


### schema
Эта **функция** будет вызвана с одной схемой x раз (в зависимости от вашего файла Swagger/OpenAPI).

|           |          |
|----------:|:---------|
|     Тип: | `(this: GeneratorOptions, props: SchemaProps) => Promise<KubbFile.File[]>` |
| Обязательно: | `false`  |

Следующие свойства будут доступны при вызове `schema`:

|   Свойство | Описание                                                                                | Тип                                                         |
|-----------:|--------------------------------------------------------------------------------------------|:-------------------------------------------------------------|
| `instance` | Экземпляр `SchemaGenerator`, этот класс можно использовать для полного контроля над экземпляром Oas. | ` Omit<SchemaGenerator, 'build'>`                            |
|  `options` | Разрешенные опции из конкретного плагина.                                               | `object`                                                     |
|   `schema` | Один объект схемы Oas           | `{ name: string; tree: Array<Schema>; value: SchemaObject }` |


> [!TIP]
> - `schema.name` содержит имя, см. `#components/schemas/Pet`, где name будет `Pet`.
> - `schema.tree` содержит AST-код, который генерируется на основе предоставленного файла Swagger/OpenAPI.
> - `schema.value` содержит значение схемы, это оригинальный объект без каких-либо преобразований.


## createReactGenerator

> [!TIP]
> `createGenerator` используется за кулисами, где мы рендерим компонент, а затем ищем все файлы и возвращаем их обратно в `createGenerator`.


::: code-group
```typescript [createGenerator]
export function createReactGenerator(parseOptions: ReactGeneratorOptions): Generator {
  return parseOptions
}
```
```typescript [Generator]
export type Generator = GeneratorOptions
```
```typescript [ReactGeneratorOptions]
export type Generator = {
  name: string
  Operations?: (this: ReactGeneratorOptions, props: OperationsProps) => KubbNode
  Operation?: (this: ReactGeneratorOptions, props: OperationProps) => KubbNode
  Schema?: (this: ReactGeneratorOptions, props: SchemaProps) => KubbNode
}
```
:::

### Operations
То же самое, что и [operations](#operations), с одним отличием - тип возврата `KubbNode` вместо `Promise<KubbFile.File>`.

### Operation
То же самое, что и [operation](#operation), с одним отличием - тип возврата `KubbNode` вместо `Promise<KubbFile.File>`.


### Schema
То же самое, что и [schema](#schema), с одним отличием - тип возврата `KubbNode` вместо `Promise<KubbFile.File>`.


## Примеры


### Создание файла для каждого operationId с помощью `createGenerator`


Ожидаемый результат:
```typescript
export const createPets = {
  method: 'get',
  url: '/pets'
}
```

Создайте свой генератор:

```tsx twoslash
import { URLPath } from '@kubb/core/utils'
import type { PluginClient } from '@kubb/plugin-client'
import { createGenerator } from '@kubb/plugin-oas'

export const clientOperationGenerator = createGenerator<PluginClient>({
  name: 'client-operation',
  async operation({ operation, instance }) {
    const pluginKey = instance.context.plugin.key
    const name = instance.context.pluginManager.resolveName({
      name: operation.getOperationId(),
      pluginKey,
      type: 'function',
    })

    const client = {
      name,
      file: instance.context.pluginManager.getFile({
        name,
        extname: '.ts',
        pluginKey,
        options: { type: 'file', pluginKey },
      }),
    }

    return [
      {
        baseName: client.file.baseName,
        path: client.file.path,
        meta: client.file.meta,
        sources: [
          {
            value: `
          export const ${operation.getOperationId()} = {
            method: '${operation.method}',
            url: '${new URLPath(operation.path).URL}'
          }
        `,
          },
        ],
      },
    ]
  },
})

```

Использование генератора:
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      generators: [clientOperationGenerator] // [!code ++]
    }),
  ],
})
```


### Создание файла для каждого operationId с помощью `createReactGenerator`

Ожидаемый результат:
```typescript
export const createPets = {
  method: 'get',
  url: '/pets'
}
```

Создайте свой генератор с помощью `@kubb/react`:

```tsx twoslash
import { URLPath } from '@kubb/core/utils'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File } from '@kubb/react'
import React from 'react'

export const clientOperationGenerator = createReactGenerator({
  name: 'client-operation',
  Operation({ operation }) {
    const { getName, getFile } = useOperationManager()

    const client = {
      name: getName(operation, { type: 'function' }),
      file: getFile(operation),
    }

    return (
      <File baseName={client.file.baseName} path={client.file.path} meta={client.file.meta}>
        <File.Source>
          {`
          export const ${operation.getOperationId()} = {
            method: '${operation.method}',
            url: '${new URLPath(operation.path).URL}'
          }
        `}
        </File.Source>
      </File>
    )
  },
})
```

Использование генератора:
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      generators: [clientOperationGenerator] // [!code ++]
    }),
  ],
})
```


Больше примеров можно найти в [examples/generators](/examples/generators).
