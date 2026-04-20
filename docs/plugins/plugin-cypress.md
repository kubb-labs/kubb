---
layout: doc

title: Kubb Cypress Plugin - Generate Cypress Commands
description: Generate Cypress test commands from OpenAPI specifications with @kubb/plugin-cypress for end-to-end API testing.
outline: deep
---

# @kubb/plugin-cypress

The `@kubb/plugin-cypress` plugin generates typed `cy.request()` wrappers from your OpenAPI schema. Each API operation becomes a reusable function that you can call inside Cypress tests, with full TypeScript support.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-cypress
```

```shell [pnpm]
pnpm add -D @kubb/plugin-cypress
```

```shell [npm]
npm install --save-dev @kubb/plugin-cypress
```

```shell [yarn]
yarn add -D @kubb/plugin-cypress
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
|  Default: | `'cypress'` |

#### output.barrelType

<!--@include: ./core/outputBarrelType.md-->

#### output.banner

<!--@include: ./core/outputBanner.md-->

#### output.footer

<!--@include: ./core/outputFooter.md-->

#### output.override

<!--@include: ./core/outputOverride.md-->

### compatibilityPreset

<!--@include: ./core/compatibilityPreset.md-->

### resolver

<!--@include: ./core/resolvers.md-->

|           |                                                                  |
| --------: | :--------------------------------------------------------------- |
|     Type: | `Partial<ResolverCypress> & ThisType<ResolverCypress>`           |
| Required: | `false`                                                          |

### paramsType
<!--@include: ./plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ./plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ./plugin-client/pathParamsType.md-->

### dataReturnType
<!--@include: ./plugin-client/dataReturnType.md-->

### baseURL
<!--@include: ./plugin-client/baseURL.md-->

### group
<!--@include: ./core/group.md-->

#### group.type

<!--@include: ./core/groupType.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Requests'`   |

### include
<!--@include: ./core/include.md-->

### exclude
<!--@include: ./core/exclude.md-->

### override
<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>
<!--@include: ./core/generators.md-->

|           |                                    |
| --------: |:-----------------------------------|
|     Type: | `Array<Generator<PluginCypress>>`  |
| Required: | `false`                            |

### transformer

<!--@include: ./core/transformers.md-->

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginCypress } from '@kubb/plugin-cypress'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas(),
  plugins: [
    pluginTs(),
    pluginCypress({
      output: {
        path: './cypress',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Requests`,
      },
    }),
  ],
})
```
## See Also

- [Cypress](https://docs.cypress.io/)
