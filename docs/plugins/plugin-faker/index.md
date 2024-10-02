---
layout: doc

title: \@kubb/plugin-faker
outline: deep
---

# @kubb/plugin-faker

With the Faker plugin, you can use [Faker](https://fakerjs.dev/) to create mocks.

## Installation

::: code-group

```shell [bun]
bun add @kubb/plugin-faker
```

```shell [pnpm]
pnpm add @kubb/plugin-faker
```

```shell [npm]
npm install @kubb/plugin-faker
```

```shell [yarn]
yarn add @kubb/plugin-faker
```

:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'mocks'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

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

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

|           |                      |
|----------:|:---------------------|
|     Type: | `'string' \| 'date'` |
| Required: | `false`              |
|  Default: | `'string'`           |

::: code-group
```typescript ['string']
faker.string.alpha()
```

```typescript ['date']
faker.date.anytime()
```
:::

### dateParser

Which parser should be used when dateType is set to 'string'.

|           |                                            |
|----------:|:-------------------------------------------|
|     Type: | `'faker' \| 'dayjs' \| 'moment' \| string` |
| Required: | `false`                                    |
|  Default: | `'faker'`                                  |

> [!TIP]
> You can use any other library. For example, when you want to use `moment` you can pass `moment` and Kubb will add the import for moment: `import moment from 'moment'`.
> This only works when the package is using default exports like Dayjs and Moment.

::: code-group

```typescript [undefined]
// schema with format set to 'date'
faker.date.anytime().toString()

// schema with format set to 'time'
faker.date.anytime().toString()

```

```typescript ['dayjs']
// schema with format set to 'date'
dayjs(faker.date.anytime()).format("YYYY-MM-DD")

// schema with format set to 'time'
dayjs(faker.date.anytime()).format("HH:mm:ss")

```

```typescript ['moment']
// schema with format set to 'date'
moment(faker.date.anytime()).format("YYYY-MM-DD")

// schema with format set to 'time'
moment(faker.date.anytime()).format("HH:mm:ss")
```
:::

### mapper

|           |           |
|----------:|:----------|
|     Type: | `Record<string, string>` |
| Required: | `false`   |


### unknownType
Which type to use when the Swagger/OpenAPI file is not providing more information.

|           |                      |
|----------:|:---------------------|
|     Type: | `'any' \| 'unknown'` |
| Required: | `false`              |
|  Default: | `'any'`              |


### regexGenerator

Choose which generator to use when using Regexp.


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
The use of Seed is intended to allow for consistent values in a test.

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
Customize the names based on the type that is provided by the plugin.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```


## Example

```typescript
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
## Links

- [Faker](https://fakerjs.dev/)
