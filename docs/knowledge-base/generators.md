---
layout: doc

title: Generators
outline: deep
---

# Generators <a href="/plugins/plugin-oas"><Badge type="info" text="@kubb/plugin-oas" /></a>

In Kubb, generators are functions that allow developers to hook into the framework’s file generation process to create, modify, or extend code automatically.
Generators are central to Kubb’s workflow, enabling the automated generation of code such as API clients, React-Query hooks, TypeScrip types, or other files based on specific input(Swagger and OpenAPI specifications).

Let's say you want to add some extra code after a generated client with [`@kubb/plugin-client`](/plugins/plugin-client#generators), to make that happen you can either:
- Use the option [`footer`](/plugins/plugin-client/#output-footer)
- Override the default generator of `@kubb/plugin-client`

> [!TIP]
> Every plugin has the `generators` option but for the most basic generation you can use [`plugin-oas`](/plugins/plugin-oas#generators).

Generators can be used with our [React](/helpers/react/) renderer or define your own renderer and return an array of KubbFiles.


## createGenerator

> [!TIP]
> - `operations`, `operation` and `schema` are all promises where you need to return an array of KubbFiles.
> - You can utilize `this` to access the [`name`](#name) or any other property that is part of the generator.


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
Define a name that could be used to identify your generator.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |

### operations
This **function** will be called with all operations that are available in your Swagger/OpenAPI file.

|           |          |
|----------:|:---------|
|     Type: | `(this: GeneratorOptions, props: OperationsProps) => Promise<KubbFile.File[]>` |
| Required: | `false`  |


The following properties will be accessible when `operations` is being called:

|               Property | Description                                                                                            | Type                                                                          |
|-----------------------:|--------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------|
|             `instance` | The `OperationsGenerator` instance, this class can be used to have full control over the Oas instance. | ` Omit<OperationGenerator, 'build'>`                                          |
|              `options` | The resolved options from a specific plugin.                                                           | `object`                                                                      |
|           `operations` | All Oas operations.                                                                                    | `Array<Operation>` |
|   `operationsByMethod` | An object that is grouped by `HttpMethod` and an object with value as `{ operation, schemas }`.        | `OperationsByMethod`    |


### operation
This **function** will be called with one operation based on your Swagger/OpenAPI file.
`operation` is almost the same as [operations](#operations) with one minor difference is that `operation` will be called x amount(based on the operations array).

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(this: GeneratorOptions, props: OperationProps) => Promise<KubbFile.File[]>` |
| Required: | `false`                                                                       |


The following properties will be accessible when `operation` is being called:

|               Property | Description                                                                                            | Type                                                                         |
|-----------------------:|--------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------|
|             `instance` | The `OperationsGenerator` instance, this class can be used to have full control over the Oas instance. | ` Omit<OperationGenerator, 'build'>`                                         |
|              `options` | The resolved options from a specific plugin.                                                           | `object`                                                                     |
|            `operation` | One Oas operation.                                                                                     | `Operation` |


### schema
This **function** will be called with one schema and that for x times(based on your Swagger/OpenAPI file).

|           |          |
|----------:|:---------|
|     Type: | `(this: GeneratorOptions, props: SchemaProps) => Promise<KubbFile.File[]>` |
| Required: | `false`  |

The following properties will be accessible when `schema` is being called:

|   Property | Description                                                                                | Type                                                         |
|-----------:|--------------------------------------------------------------------------------------------|:-------------------------------------------------------------|
| `instance` | The `SchemaGenerator` instance, this class can be used to have full control over the Oas instance. | ` Omit<SchemaGenerator, 'build'>`                            |
|  `options` | The resolved options from a specific plugin.                                               | `object`                                                     |
|   `schema` | One Oas schema object           | `{ name: string; tree: Array<Schema>; value: SchemaObject }` |


> [!TIP]
> - `schema.name` contains the name, see `#components/schemas/Pet` where name will be `Pet`.
> - `schema.tree` contains the AST code that is generated based on the provided Swagger/OpenAPI file.
> - `schema.value` contains the value of the schema, this is the original object without any transformations.


## createReactGenerator

> [!TIP]
> `createGenerator` is being used behind the scenes where we render the component and then search for all files and return that back to `createGenerator`.


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
Same as [operations](#operations) with one difference is that the return type is a `KubbNode` instead of `Promise<KubbFile.File>`.

### Operations
Same as [operation](#operation) with one difference is that the return type is a `KubbNode` instead of `Promise<KubbFile.File>`.


### Schema
Same as [schema](#schema) with one difference is that the return type is a `KubbNode` instead of `Promise<KubbFile.File>`.


## Examples


### Create a file for every operationId with `createGenerator`


Expected result:
```typescript
export const createPets = {
  method: 'get',
  url: '/pets'
}
```

Create your generator:

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

Use of the generator:
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


### Create a file for every operationId with `createReactGenerator`

Expected result:
```typescript
export const createPets = {
  method: 'get',
  url: '/pets'
}
```

Create your generator with `@kubb/react-fabric`:

```tsx twoslash
import { URLPath } from '@kubb/core/utils'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File } from '@kubb/react-fabric'
import React from 'react'

export const clientOperationGenerator = createReactGenerator({
  name: 'client-operation',
  Operation({ operation, instance }) {
    const { getName, getFile } = useOperationManager(generator)

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

Use of the generator:
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


More examples can be found as part of [examples/generators](/examples/generators).
