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

## defineConfig

The `defineConfig` helper provides TypeScript type checking and IntelliSense for your configuration:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  // Type-safe configuration
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [],
})
```

**Function form** - Access CLI arguments:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig(({ config, watch, logLevel }) => {
  return {
    input: { path: './petStore.yaml' },
    output: {
      path: './src/gen',
      clean: !watch, // Don't clean in watch mode
    },
    plugins: [],
  }
})
```

## Configuration Options

Configure Kubb's behavior with these options. All are optional unless marked as required.

### name

Display name for this configuration in CLI output. Useful when running multiple configs.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `false`  |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  name: 'petStore', // Shows "Generating petStore..." in CLI
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
})
```

### root

Project root directory - can be absolute or relative to the config file location.

|           |                |
|----------:|:---------------|
|     Type: | `string`       |
| Required: | `false`        |
|  Default: | `process.cwd()` |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.', // Relative to kubb.config.ts location
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
})
```

### input

OpenAPI specification source. Use either `input.path` or `input.data` (not both).

#### input.path

Path to your OpenAPI file - absolute or relative to `root`.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`*  |

> [!NOTE]
> Required if `input.data` is not provided.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml', // or .json, or a URL
  },
  output: { path: './src/gen' },
})
```

#### input.data

OpenAPI specification as a string or object. Useful for programmatic generation.

|           |                     |
|----------:|:--------------------|
|     Type: | `string \| unknown` |
| Required: | `true`*             |

> [!NOTE]
> Required if `input.path` is not provided.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

// You can import a JSON file and pass it as data
export default defineConfig({
  input: {
    data: { /* your OpenAPI spec object */ },
  },
  output: { path: './src/gen' },
})
```

### output

Controls where and how files are generated.

#### output.path

Directory for generated files - absolute or relative to `root`.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`   |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen', // All generated files go here
  },
})
```

#### output.clean

Remove the output directory before generating new files.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

> [!WARNING]
> This deletes the entire `output.path` directory. Only use with dedicated output folders.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    clean: true, // Deletes ./src/gen before generating
  },
})
```

#### output.format

Code formatter to use on generated files.

|           |                                             |
|----------:|:--------------------------------------------|
|     Type: | `'auto' \| 'prettier' \| 'biome' \| false` |
| Required: | `false`                                     |
|  Default: | `'prettier'`                                |

- `'auto'` - Automatically detect and use available formatter (checks for biome, oxfmt then prettier)
- `'prettier'` - Format with [Prettier](https://prettier.io/) (default, included since v3.17.1)
- `'biome'` - Format with [Biome](https://biomejs.dev/)
- `'oxfmt'` - Format with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter)
- `false` - Skip formatting

> [!NOTE]
> Kubb respects your local `.prettierrc` or `biome.json` configuration files.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'auto', // Automatically detect and use available formatter
  },
})
```

#### output.lint

Linter to run on generated files.

|           |                                                       |
|----------:|:------------------------------------------------------|
|     Type: | `'auto' \| 'eslint' \| 'biome' \| 'oxlint' \| false` |
| Required: | `false`                                               |
|  Default: | `false`                                               |

- `'auto'` - Automatically detect and use available linter (checks for biome, oxlint, then eslint)
- `'eslint'` - Lint with [ESLint](https://eslint.org/)
- `'biome'` - Lint with [Biome](https://biomejs.dev/)
- `'oxlint'` - Lint with [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- `false` - Skip linting (default)

> [!WARNING]
> Linting large outputs can slow down generation. Consider running linters separately in CI.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'biome',
    lint: 'auto', // Automatically detect and use available linter
  },
})
```

#### output.write

Write generated files to disk. Set to `false` to generate in-memory only (useful for testing).

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    write: false, // Don't write to disk (testing mode)
  },
})
```

#### output.extension

Override file extensions in generated imports/exports. Useful for ESM compatibility.

|           |                                              |
|----------:|:---------------------------------------------|
|     Type: | `Record<KubbFile.Extname, KubbFile.Extname>` |
| Required: | `false`                                      |
|  Default: | `{ '.ts': '.ts' }`                           |

> [!TIP]
> Use `{ '.ts': '.js' }` for ESM compatibility when transpiling TypeScript to JavaScript.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    extension: {
      '.ts': '.js', // Import as .js instead of .ts
    },
  },
})
```

#### output.barrelType

Controls generation of barrel files (`index.ts`). This sets the root barrel file behavior.

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

- `'all'` - Export everything with `export *`
- `'named'` - Export named exports only
- `false` - Don't create barrel files

> [!NOTE]
> Individual plugins have their own `barrelType` option. This controls the root `src/gen/index.ts` file.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    barrelType: 'all', // Export everything
  },
})
```

#### output.defaultBanner

Banner comment added to generated files. Indicates the file was auto-generated.

|           |                              |
|----------:|:-----------------------------|
|     Type: | `'simple' \| 'full' \| false` |
| Required: | `false`                      |
|  Default: | `'simple'`                   |

- `'simple'` - Basic banner with link and source file
  ```typescript
  /**
   * Generated by Kubb (https://kubb.dev/).
   * Do not edit manually.
   *
   * Source: petStore.yaml
   */
  ```
- `'full'` - Detailed banner with API title, description, and OpenAPI version
- `false` - No banner
```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    defaultBanner: 'full', // Include full API details
  },
})
```

#### output.override

Whether to override existing external files that can be generated by Kubb if they already exist.
When setting the option in the global configuration, all plugins inherit the same behavior by default.
However, all plugins also have an `output.override` option, which can be used to override the behavior for a specific plugin.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    override: true,
    // If external files that can be generated by Kubb are referenced in the config,
    // they will be overridden
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

```typescript twoslash [kubb.config.ts]
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

```typescript twoslash [kubb.config.ts]
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

```typescript twoslash [kubb.config.ts]
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

```typescript twoslash [kubb.config.ts]
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
