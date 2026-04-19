---
layout: doc

title: Kubb Client Plugin - Generate API Clients
description: Generate type-safe HTTP clients with Axios, Fetch, or custom implementations using @kubb/plugin-client for OpenAPI endpoints.
outline: deep
---

# @kubb/plugin-client

Generate API client code for handling API requests.

By default, this plugin uses [Axios](https://axios-http.com/docs/intro), but you can add your own client. See [Use of Fetch](/guide/fetch) for an example.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-client
```

```shell [pnpm]
pnpm add -D @kubb/plugin-client
```

```shell [npm]
npm install --save-dev @kubb/plugin-client
```

```shell [yarn]
yarn add -D @kubb/plugin-client
```

:::

## Options

### output

Specify the export location for the files and define the behavior of the output.

#### output.path

<!--@include: ./core/outputPath.md-->

|           |             |
| --------: | :---------- |
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'clients'` |

#### output.barrelType

<!--@include: ./core/outputBarrelType.md-->

#### output.banner

<!--@include: ./core/outputBanner.md-->

#### output.footer

<!--@include: ./core/outputFooter.md-->

#### output.override

<!--@include: ./core/outputOverride.md-->

### contentType

<!--@include: ./core/contentType.md-->

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
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### importPath

<!--@include: ./plugin-client/importPath.md-->

### operations

Create `operations.ts` file with all operations grouped by methods.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dataReturnType

<!--@include: ./plugin-client/dataReturnType.md-->

### urlType

Export urls that are used by operation x

|           |                     |
| --------: | :------------------ |
|     Type: | `'export' \| false` |
| Required: | `false`             |
|  Default: | `false`             |

- `'export'` will make them part of your barrel file
- `false` will not make them exportable

```typescript
export function getGetPetByIdUrl(petId: GetPetByIdPathParams["petId"]) {
  return `/pet/${petId}` as const;
}
```

### paramsType

<!--@include: ./plugin-client/paramsType.md-->

### paramsCasing

<!--@include: ./plugin-client/paramsCasing.md-->

### pathParamsType

<!--@include: ./plugin-client/pathParamsType.md-->

### parser

<!--@include: ./plugin-client/parser.md-->

### client

<!--@include: ./plugin-client/client.md-->

### clientType

<!--@include: ./plugin-client/clientType.md-->

### wrapper

<!--@include: ./plugin-client/wrapper.md-->

### bundle

<!--@include: ./plugin-client/bundle.md-->

### baseURL

<!--@include: ./plugin-client/baseURL.md-->

### include

<!--@include: ./core/include.md-->

### exclude

<!--@include: ./core/exclude.md-->

### override

<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>

<!--@include: ./core/generators.md-->

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `Array<Generator<PluginClient>>` |
| Required: | `false`                          |

### transformers

<!--@include: ./core/transformers.md-->

### compatibilityPreset

Use `compatibilityPreset` to control which naming convention is used for generated files and functions.

|           |                         |
| --------: | :---------------------- |
|     Type: | `'default' \| 'kubbV4'` |
| Required: | `false`                 |
|  Default: | `'default'`             |

- `'default'` — v5 naming conventions (recommended)
- `'kubbV4'` — v4 naming conventions for backwards compatibility

```typescript
pluginClient({ compatibilityPreset: "kubbV4" });
```

### resolver

Override individual resolver methods to customize generated names. Any method you omit falls back to the preset resolver. Use `this.default(...)` to call the preset's implementation.

|           |                                                      |
| --------: | :--------------------------------------------------- |
|     Type: | `Partial<ResolverClient> & ThisType<ResolverClient>` |
| Required: | `false`                                              |

```typescript
import { pluginClient } from "@kubb/plugin-client";

pluginClient({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Client`;
    },
  },
});
```

### transformer <img src="../public/icons/experimental.svg"/>

Apply an AST `Visitor` to transform operation nodes before they are printed.

|           |           |
| --------: | :-------- |
|     Type: | `Visitor` |
| Required: | `false`   |

```typescript
import { pluginClient } from "@kubb/plugin-client";

pluginClient({
  transformer: {
    operation(node) {
      return { ...node, operationId: `api_${node.operationId}` };
    },
  },
});
```

## Example

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginClient } from "@kubb/plugin-client";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient({
      output: {
        path: "./clients/axios",
        barrelType: "named",
        banner: "/* eslint-disable no-alert, no-console */",
        footer: "",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Service`,
      },
      resolver: {
        resolveName(name) {
          return `${this.default(name)}Client`;
        },
      },
      operations: true,
      parser: "client",
      exclude: [
        {
          type: "tag",
          pattern: "store",
        },
      ],
      pathParamsType: "object",
      dataReturnType: "full",
      client: "axios",
    }),
  ],
});
```

## See Also

- [Axios](https://axios-http.com/docs/intro)
