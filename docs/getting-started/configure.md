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

## Basic

> [!TIP]
> When using an `import` statement you need to set `"type": "module"` in your `package.json`.
> You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.

::: code-group
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

:::

## Conditional

If the config needs to be conditionally determined based on CLI options flags, it can be exported as a function instead.

Here you can choose between returning the config options synchronously or asynchronously.

::: code-group

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

:::

## Multiple plugins

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

## Multiple configs

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
