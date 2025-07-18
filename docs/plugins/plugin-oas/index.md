---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# @kubb/plugin-oas


## Installation
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

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path
Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'schemas'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                  |
|----------:|:---------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer
Add a footer text at the end of every file.

|           |         |
|----------:|:--------|
|     Type: | `string \| (oas: Oas) => string`        |
| Required: | `false` |


### group
<!--@include: ../core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### validate

Validate your [`input`](/getting-started/configure#input) based on `@readme/openapi-parser`.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

### serverIndex

Which server to use from the array of `servers.url[serverIndex]`

> [!TIP]
> Defining the server here will make it possible to use that endpoint as `baseURL` in other plugins.

|           |          |
|----------:|:---------|
|     Type: | `number` |
| Required: | `false`  |

- `0` will return `http://petstore.swagger.io/api`
- `1` will return `http://localhost:3000`

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

Defines how the discriminator value should be interpreted during processing.
This has been mentioned in [issues/1736](https://github.com/kubb-labs/kubb/issues/1736).


|           |                          |
|----------:|:-------------------------|
|     Type: | ` 'strict' \| 'inherit'` |
| Required: | `'strict'`                 |

- `'inherit'` Replaces the `oneOf` schema with the schema referenced by `discriminator.mapping[key]`.
- `'strict'` Uses the `oneOf` schemas as defined, without modification.

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
Override some behaviour of the Oas class instance, see `@kubb/oas`.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `typeof Oas`                             |
| Required: | `false`                        |


### generators <img src="/icons/experimental.svg"/>
Define some generators to create files based on the operation and/or schema. All plugin are using generators to create files based on the OperationGenerator and SchemaGenerators. An empty array will result in no schema's being generated, in v2 of Kubb we used `output: false`.

See [Generators](/knowledge-base/generators) for more information on how to use generators.

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

## Example

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

## Links

- [Oas](https://github.com/readmeio/oas)
