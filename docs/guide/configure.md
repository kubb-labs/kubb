---
layout: doc

title: kubb.config.ts
outline: deep
---

# Configuring Kubb

Kubb is configured with a configuation file (preferably with `kubb.config.ts`).

## Usage

When you use the CLI of Kubb, Kubb will automatically read the configuration file in the root directory of the current project and resolve it in the following order:

- `kubb.config.ts`
- `kubb.config.js`
- `kubb.config.mjs`
- `kubb.config.cjs`

We recommend using the .ts format for the configuration file and importing the `defineConfig` utility function from `@kubb/core`. It provides friendly TypeScript type hints and autocompletion, which can help you avoid errors in the configuration.

In the background Kubb uses [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) which means you can als use the following:

- A `"kubb"` key in your package.json file.
- A `.kubbrc` file written in JSON or YAML.
- A `.kubbrc.json` file.
- A `.kubbrc.yaml` or `.kubbrc.yml` file.

::: tip
You can also use `configs/kubb.config.ts` or `.config/kubb.config.ts` instead of `kubb.config.ts` in the root of your project.
:::

## DefineConfig

When using TypeScript/JavaScript you need to use `defineConfig` to create your config.

```typescript
export const defineConfig = (
  options:
    | MaybePromise<KubbUserConfig>
    | ((
      /** The options derived from the CLI flags */
      cliOptions: CLIOptions,
    ) => MaybePromise<KubbUserConfig>),
) => options
```

## Basic

::: tip
When using an `import` statement you need to set `"type": "module"` in your `package.json`.

You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.
:::

::: code-group

```typescript [kubb.config.ts]
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

If the config needs to be conditionally determined based on CLI options flags, it can be exported as a function instead.<br/>
Here you can choose between returning the config options synchronously or asynchronously.

```typescript
// CLI options flags
export type CLIOptions = {
  /**
   * Path to `kubb.config.ts`
   */
  config?: string
  /**
   * Watch changes on input
   */
  watch?: string

  /**
   * Log level to report when using the CLI
   *
   * `silent` will hide all information that is not relevant
   *
   * `info` will show all information possible(not related to the PluginManager)
   *
   * `debug` will show all information possible(related to the PluginManager), handy for seeing logs
   * @default `silent`
   */
  logLevel?: LogLevels
}
```

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig(async ({ config, watch, logLevel }: CLIOptions) => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)

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

::: tip
Since version `2.x.x` we also support using multiple of the same plugin.

:::

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'

export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      createSwagger(
        {
          'output': 'schemas',
          'validate': true,
        },
      ),
      createSwagger(
        {
          'output': 'schemas2',
          'validate': true,
        },
      ),
    ],
  }
})
```

## Multiple configs

::: tip
Since version `2.x.x` we also support using multiple configs.

:::

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'

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
      createSwagger(
        {
          'output': 'schemas',
          'validate': true,
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
      createSwagger(
        {
          'output': 'schemas',
          'validate': true,
        },
      ),
    ],
  },
])
```
