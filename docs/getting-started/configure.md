---
layout: doc

title: Configure
outline: deep
---

# Configure
Kubb can be configured with a configuration file (preferably with `kubb.config.ts`), for that we are using [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) to load the config.

## Usage

When you use Kubb’s CLI, it will automatically read the configuration file from the root directory of your project and process it in the following order:
- `kubb.config.ts`
- `kubb.config.js`
- `kubb.config.mjs`
- `kubb.config.cjs`
- A `.kubbrc` file written in JavaScript

We recommend using the `.ts` format for the configuration file and importing the `defineConfig` utility function from `@kubb/core`.
This helper provides TypeScript friendly type hints and autocompletion, which can help you avoid errors in the configuration.

> [!TIP]
> You can also use `configs/kubb.config.ts` or `.config/kubb.config.ts` instead of `kubb.config.ts` in the root of your project.

## DefineConfig

When using TypeScript/JavaScript you should consider using `defineConfig`.

```typescript
export const defineConfig = (
  options:
    | MaybePromise<KubbUserConfig>
    | ((
      /** The options derived from the CLI flags */
      args: Args,
    ) => MaybePromise<KubbUserConfig>),
) => options
```

## Options
This page is a reference to the different options you can use for configuring your Kubb config.
By setting the following options you can override the default behavior of Kubb and even extend it with your plugins.

### name
The name to display in the CLI output.

|       |          |
| ----: |:---------|
| Type: | `string` |
| Required: | `false`  |

::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  name: 'petStore',
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
  },
  {
    name: 'petStoreV2',
    root: '.',
    input: {
      path: './petStoreV2.yaml',
    },
    output: {
      path: './src/gen-v2',
    },
  },
])
```
:::

### root
The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.

|          |                |
|---------:|:---------------|
|    Type: | `string`       |
| Required: | `false`  |
| Default: | `process.cwd()` |


```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

### input
You can use either `input.path` or `input.data`, depending on your specific needs.

#### input.path
Specify your Swagger/OpenAPI file, either as an absolute path or a path relative to the [root](#root).

|           |                 |
|----------:|:----------------|
|     Type: | `string`        |
| Required: | `true`            |

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

#### input.data
A `string` or `object` that contains your Swagger/OpenAPI data.

|           |                     |
|----------:|:--------------------|
|     Type: | `string \| unknown` |
| Required: | `true`              |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

import petStore from './petStore.yaml'

export default defineConfig({
  input: {
    data: petStore,
  },
  output: {
    path: './src/gen',
  },
})
```

### output

#### output.path
The path where all generated files will be exported.
This can be an absolute path or a path relative to the specified [root](#root) option.

|           |                 |
|----------:|:----------------|
|     Type: | `string`        |
| Required: | `true`            |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

#### output.clean
Clean the output directory before each build.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
})
```

#### output.format
Specifies the formatting tool to be used.


> [!IMPORTANT]
> By default, we use [Prettier](https://prettier.io/). Since Kubb `v3.17.1` included Prettier as a dependency, this ensures backward compatibility.


- `'prettier'`: Uses [Prettier](https://prettier.io/) for code formatting.
- `'biome'`: Uses [Biome](https://biomejs.dev/) for code formatting.

|           |                                  |
|----------:|:---------------------------------|
|     Type: | `'prettier' \| 'biome' \| false` |
| Required: | `false`                          |
|  Default: | `prettier`                       |


#### output.lint
Specifies the formatting tool to be used.

- `'eslint'`: Represents the use of [Eslint](https://eslint.org/), a widely used JavaScript linter.
- `'biome'`: Represents the [Biome](https://biomejs.dev/) linter, a modern tool for code scanning.
- `'oxlint'`: Represents the [Oxlint](https://oxc.rs/docs/guide/usage/linter) tool for linting purposes.

|           |                                            |
|----------:|:-------------------------------------------|
|     Type: | `'eslint' \| 'biome' \| 'oxlint' \| false` |
| Required: | `false`                                    |

#### output.write
Save files to the file system.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `true`    |
|  Default: | `true`     |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    write: true,
  },
})
```

#### output.extension
Override the extension to the generated imports and exports, by default each plugin will add an extension.

|           |                          |
|----------:|:-------------------------|
|     Type: | `Record<KubbFile.Extname, KubbFile.Extname>`                |
| Required: | `false`                  |
|  Default: | `{ '.ts': '.ts'}` |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    extension: {
      '.ts': '.js',
    },
  },
})
```

#### output.barrelType
Specify how `index.ts` files should be created. You can also disable the generation of barrel files here. While each plugin has its own `barrelType` option, this setting controls the creation of the root barrel file, such as` src/gen/index.ts`.

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    barrelType: 'all',
  },
})
```

#### output.defaultBanner
Add a default banner to the beginning of every generated file. This makes it clear that the file was generated by Kubb.
|           |                             |
|----------:|:----------------------------|
|     Type: | `'simple' | 'full' | false` |
| Required: | `false`                     |
|  Default: | `'simple'`                   |

- `'simple'`: will only add banner with link to Kubb
```
/**
* Generated by Kubb (https://kubb.dev/).
* Do not edit manually.
*
* Source: petStore.yaml
*/
```
- `'full'`: will add source, title, description and the OpenAPI version used


```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    defaultBanner: false,
  },
})
```

### plugins

|           |                         |
|----------:|:------------------------|
|     Type: | `Array<KubbUserPlugin>` |
| Required: | `false`                 |


An array of Kubb plugins used for generation. Each plugin may have additional configurable options (defined within the plugin itself). If a plugin relies on another plugin, an error will occur if the required dependency is missing. Refer to “pre” for more details.
How to use and set up plugins, see [plugins](/knowledge-base/plugins/).

```typescript [kubb.config.ts]
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
      output: {
        path: 'schemas',
      },
      validate: true,
    }),
  ],
})
```

## Examples

### Basic

> [!TIP]
> When using an `import` statement you need to set `"type": "module"` in your `package.json`.
> You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
})
```

### Conditional
If the config needs to be conditionally determined based on CLI options flags, it can be exported as a function instead.
Here you can choose between returning the config options **synchronously** or **asynchronously**.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig(({ config, watch, logLevel }) => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
  }
})
```

### Multiple plugins

> [!TIP]
> With version `2.x.x` or higher we also support using multiple versions of the same plugin.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      pluginOas(
        {
          output: {
            path: 'schemas',
          },
        },
      ),
      pluginOas(
        {
          output: {
            path: 'schemas2',
          },
        },
      ),
    ],
  }
})
```

### Multiple configs

> [!TIP]
> Since version `2.x.x` or higher we also support using multiple configs.

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      pluginOas(
        {
           output: {
            path: 'schemas',
          },
        },
      ),
    ],
  },
  {
    name: 'petStoreV2',
    root: '.',
    input: {
      path: './petStoreV2.yaml',
    },
    output: {
      path: './src/gen-v2',
    },
    plugins: [
      pluginOas(
        {
          output: {
            path: 'schemas',
          },
        },
      ),
    ],
  },
])
```
