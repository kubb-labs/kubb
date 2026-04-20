---
layout: doc

title: Kubb Faker Plugin - Generate Mock Data
description: Generate Faker.js mock data helpers from OpenAPI schemas with @kubb/plugin-faker for testing and development.
outline: deep
---

# @kubb/plugin-faker

Generate mock data helpers with [Faker](https://fakerjs.dev/).

## Installation

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

## Options

### output

Specify the export location for the files and define the behavior of the output.

#### output.path

<!--@include: ./core/outputPath.md-->

|           |           |
| --------: | :-------- |
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'mocks'` |

#### output.barrelType

<!--@include: ./core/outputBarrelType.md-->

#### output.banner

<!--@include: ./core/outputBanner.md-->

#### output.footer

<!--@include: ./core/outputFooter.md-->

#### output.override

<!--@include: ./core/outputOverride.md-->

### group

<!--@include: ./core/group.md-->

#### group.type

<!--@include: ./core/groupType.md-->

#### group.name

Return the name of a group based on the group name. This is used for file and helper name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### dateParser

Choose which formatter to use when `date`, `time`, or `datetime` schema nodes are represented as strings.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'faker' \| 'dayjs' \| 'moment' \| string` |
| Required: | `false`                                    |
|  Default: | `'faker'`                                  |

> [!TIP]
> You can use another library that exposes a default export. Kubb adds the import automatically.

::: code-group

```typescript ['faker']
faker.date.anytime().toISOString().substring(0, 10)
```

```typescript ['dayjs']
dayjs(faker.date.anytime()).format('YYYY-MM-DD')
```

```typescript ['moment']
moment(faker.date.anytime()).format('YYYY-MM-DD')
```

:::

### mapper

Override individual object properties with custom faker expressions.

|           |                         |
| --------: | :---------------------- |
|     Type: | `Record<string, string>` |
| Required: | `false`                 |

### paramsCasing

Transform path, query, and header parameter property names in generated mocks.

> [!IMPORTANT]
> Use the same `paramsCasing` value in `@kubb/plugin-ts` so the generated mock objects stay compatible with the generated types.

|           |               |
| --------: | :------------ |
|     Type: | `'camelcase'` |
| Required: | `false`       |
|  Default: | `undefined`   |

### regexGenerator

Choose which generator to use for regex-backed string schemas.

|           |                        |
| --------: | :--------------------- |
|     Type: | `'faker' \| 'randexp'` |
| Required: | `false`                |
|  Default: | `'faker'`              |

::: code-group

```typescript ['faker']
faker.helpers.fromRegExp('^[A-Z]+$')
```

```typescript ['randexp']
new RandExp(/^[A-Z]+$/).gen()
```

:::

### seed

Seed faker for deterministic output.

|           |                   |
| --------: | :---------------- |
|     Type: | `number \| number[]` |
| Required: | `false`           |

### include

<!--@include: ./core/include.md-->

### exclude

<!--@include: ./core/exclude.md-->

### override

<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>

<!--@include: ./core/generators.md-->

|           |                                 |
| --------: | :------------------------------ |
|     Type: | `Array<Generator<PluginFaker>>` |
| Required: | `false`                         |

### compatibilityPreset

<!--@include: ./core/compatibilityPreset.md-->

### resolver

Customize helper naming on top of the active compatibility preset.

```typescript
pluginFaker({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Mock`
    },
  },
})
```

### transformer

Apply a single AST visitor before the faker helpers are rendered.

```typescript
pluginFaker({
  transformer: {
    schema(node) {
      return { ...node, description: undefined }
    },
  },
})
```

### printer

Override individual printer node handlers to customize how specific schema types are rendered.

Each key is a `SchemaType` (for example `'integer'`, `'date'`, or `'ref'`). The function you provide replaces the built-in handler for that type. Use `this.transform` to recurse into nested schema nodes and `this.options` to read printer options.

|           |                        |
| --------: | :--------------------- |
|     Type: | `{ nodes?: PrinterFakerNodes }` |
| Required: | `false`                |

::: code-group

```typescript [Override integer to float()]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  printer: {
    nodes: {
      integer() {
        return 'faker.number.float()'
      },
    },
  },
})
```

```typescript [Override date strings]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  printer: {
    nodes: {
      date(node) {
        if (node.representation === 'string') {
          return 'new Date().toISOString().substring(0, 10)'
        }

        return 'new Date()'
      },
    },
  },
})
```

:::

## Example

```typescript twoslash
import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs({
      output: {
        path: './types',
      },
    }),
    pluginFaker({
      output: {
        path: './mocks',
        barrelType: 'named',
      },
      seed: [100],
      paramsCasing: 'camelcase',
      compatibilityPreset: 'kubbV4',
    }),
  ],
})
```

## See Also

- [Faker](https://fakerjs.dev/)
