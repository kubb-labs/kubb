---
layout: doc

title: kubb.config.js
outline: deep
---

# Configuring Kubb

Kubb is configured with a configuation file (preferably with `kubb.config.js`).

## TypeScript/JavaScript

::: tip
When using a `import` statement you need to set `"type": "module"` in your `package.json`.

You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs for CJS.
:::

### DefineConfig

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

#### Basic config

::: code-group

```typescript [kubb.config.js]
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

#### Conditional config

If the config needs to be conditionally determined based on CLI options flags, it can be exported as a function instead.<br/>
Here you can choose between returning the config options synchronously or asynchronously.

```typescript
// CLI options flags
export type CLIOptions = {
  /**
   * Path to `kubb.config.js`
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

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig(async ({ config, debug, watch }) => {
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

### Example with a plugin

::: code-group

```typescript [kubb.config.js]
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
    ],
  }
})
```

:::

## JSON

You can use a [JSON schema](https://github.com/kubb-project/kubb/blob/main/packages/core/schema.json) to be sure you are using the correct configs.

### Example with a plugin

::: code-group

```json [kubb.json]
{
  "$schema": "@kubb/core/schemas.json",
  "root": ".",
  "input": {
    "path": "./petStore.yaml"
  },
  "output": {
    "path": "./src/gen"
  },
  "logLevel": "info",
  "plugins": [
    [
      "@kubb/swagger",
      {
        "output": "schemas",
        "validate": true
      }
    ]
  ]
}
```

:::

<Badge type="warning" text="experimental" /> Since version `1.15.x` we also support using multiple of the same plugin.

::: code-group

```json [kubb.json]
{
  "$schema": "@kubb/core/schemas.json",
  "root": ".",
  "input": {
    "path": "./petStore.yaml"
  },
  "output": {
    "path": "./src/gen"
  },
  "logLevel": "info",
  "plugins": [
    [
      "@kubb/swagger",
      {
        "output": "schemas",
        "validate": true
      }
    ],
    [
      "@kubb/swagger",
      {
        "output": "schemas2",
        "validate": true
      }
    ]
  ]
}
```

:::

## YAML

### Example with a plugin

::: code-group

```yaml [.kubbrc]
root: .
input:
  path: ./petStore.yaml
output:
  path: ./src/gen
plugins:
  - '@kubb/swagger'
  - output: schemas
    validate: true
```

:::

Read more about [configuring the options](/configuration/options).
