---
layout: doc

title: Configure
outline: deep
---

# Configure
Kubb is configured with a configuation file (preferably with `kubb.config.ts`) with [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) being used to load the config.

## Usage

When you use Kubb’s CLI, it will automatically read the configuration file from the root directory of your project and process it in the following order:
- `kubb.config.ts`
- `kubb.config.js`
- `kubb.config.mjs`
- `kubb.config.cjs`
- A `"kubb"` key in your package.json file.
- A `.kubbrc` file written in JSON or YAML.
- A `.kubbrc.json` file.
- A `.kubbrc.yaml` or `.kubbrc.yml` file.

We recommend using the .ts format for the configuration file and importing the `defineConfig` utility function from `@kubb/core`.
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
Optional config name to show in CLI output.

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
Project root directory. This can be an absolute path or a path relative to the location of your `kubb.config.ts` file.

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
You can use `input.path` or `input.data` depending on the needs you have.

#### input.path
Define your Swagger/OpenAPI file. This can be an absolute path or a path relative to the `root`.

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

`string` or `object` containing your Swagger/OpenAPI data.

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
This can be an absolute path or a path relative to the specified `root` option.

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
Override the extension to the generated imports and exports, by default the plugin will add an extension.

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
Define what needs to exported, here you can also disable the export of barrel files.

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

### plugins

|           |                         |
|----------:|:------------------------|
|     Type: | `Array<KubbUserPlugin>` |
| Required: | `false`                 |


An array of Kubb plugins that will be used in the generation.
Each plugin may include additional configurable options(defined in the plugin itself).
If a plugin depends on another plugin, an error will be returned if the required dependency is missing. See pre for more details.

How to use and set up plugins, see [plugins](/knowledge-base/plugins).

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
