---
layout: doc

title: \@kubb/plugin-faker
outline: deep
---

# @kubb/plugin-faker <a href="https://paka.dev/npm/@kubb/plugin-faker@latest/api">🦙</a>

With the Swagger Faker plugin, you can use [Faker](https://fakerjs.dev/) to create mocks based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/plugin-faker @kubb/plugin-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/plugin-faker @kubb/plugin-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/plugin-faker @kubb/plugin-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/plugin-faker @kubb/plugin-ts @kubb/swagger
```

:::

## Options

### output

#### output.path

Relative path to save the Faker mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'mocks'`

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  output: {
    path: './mocks',
  },
})
```
:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  output: {
    path: './mocks',
    exportAs: 'mocks',
  },
})
```
:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  output: {
    path: './mocks',
    extName: '.js',
  },
})
```
:::

#### output.exportType

Define what needs to be exported, you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  output: {
    path: './mocks',
    exportType: 'barrel',
  },
})
```
:::

### group

Group the Faker mocks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output
::: tip
When defining a custom output path, you should also update `output.path` to contain the same root path.
:::

::: v-pre
Relative path to save the grouped Faker mocks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### group.exportAs

Name to be used for the `export * as {{exportAs}} from './`

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Mocks'`
:::

::: info

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  output: {
    path: './mocks'
  },
  group: {
    type: 'tag',
    output: './mocks/{{tag}}Mocks',
  },
})
```
:::

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

::: info TYPE

::: code-group

```typescript ['string']
faker.string.alpha()
```

```typescript ['date']
faker.date.anytime()
```

:::

::: info
Type: `'string' | 'date'` <br/>
Default: `'string'`

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  dateType: 'string',
})
```
:::

### dateParser

Which parser should be used when dateType is set to 'string'.

::: tip
You can use any other library. For example, when you want to use `moment` you can pass `moment` and Kubb will add the import for moment: `import moment from 'moment'`.

This only works when the package is using default exports like Dayjs and Moment.
:::

::: info TYPE

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

::: info
Type: `'dayjs' | 'moment' | string` <br/>
Default: `undefined`

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  dateParser: 'dayjs',
})
```
:::

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

::: info TYPE

::: code-group

```typescript ['any']
any
```

```typescript ['unknown']
unknown
```

:::

::: info
Type: `'any' | 'unknown'` <br/>
Default: `'any'`

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  unknownType: 'any',
})
```
:::

### regexGenerator

Choose which generator to use when using Regexp.

::: info TYPE

::: code-group

```typescript ['faker']
faker.helpers.fromRegExp(new RegExp(/test/))
```

```typescript ['randexp']
new RandExp(/test/).gen()
```

:::

::: info
Type: `'faker' | 'randexp'` <br/>
Default: `'faker'`

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  regexGenerator: 'randexp',
})
```
:::

### seed

The use of Seed is intended to allow for consistent values in a test.

::: info
Type: `'number' | 'number[]'` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  seed: [222],
})
```
:::

### include

An array containing include parameters to include tags/operations/methods/paths.

::: info TYPE

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Include>` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  include: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```
:::

### exclude

An array containing exclude parameters to exclude/skip tags/operations/methods/paths.

::: info TYPE

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Exclude>` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  exclude: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```

:::

### override

An array containing override parameters to override `options` based on tags/operations/methods/paths.

::: info TYPE

```typescript [Override]
export type Override = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

:::

::: info

Type: `Array<Override>` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {
        dateType: 'date',
      },
    },
  ],
})
```
:::

### transformers

#### transformers.name

Override the name of the faker data that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

```typescript twoslash
import { pluginFaker } from '@kubb/plugin-faker'

const plugin = pluginFaker({
  transformers: {
    name: (name) => {
      return `${name}Mock`
    },
  },
})
```
:::


## Example

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
      },
      group: {
        type: 'tag',
        output: './mocks/{{tag}}Mocks',
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
