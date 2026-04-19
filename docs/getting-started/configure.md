---
layout: doc

title: Kubb Configuration Guide - kubb.config.ts Reference
description: Complete Kubb configuration reference. Learn how to configure input/output, plugins, formatting, and advanced options in kubb.config.ts.
outline: deep
---

# Kubb Configuration Guide

**Configure Kubb using `kubb.config.ts` to control code generation behavior.** This comprehensive guide covers all configuration options for customizing how Kubb generates TypeScript code from your OpenAPI specifications.

## What is a Configuration File?

The Kubb configuration file (`kubb.config.ts`) defines:

- **Input source** - Path to your OpenAPI/Swagger specification
- **Output settings** - Where generated files are saved and how they're formatted
- **Plugins** - Which code generators to use (TypeScript, React Query, Zod, etc.)
- **Generation options** - Custom transformers, formatters, and advanced settings

Kubb uses [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) to automatically discover configuration files in your project root.

## Configuration File Discovery

**Kubb automatically searches for config files in this order:**

1. `kubb.config.ts` (recommended - TypeScript with type safety)
2. `kubb.config.mts` (TypeScript ES modules explicit)
3. `kubb.config.cts` (TypeScript CommonJS explicit)
4. `kubb.config.js` (JavaScript ES modules)
5. `kubb.config.mjs` (JavaScript ES modules explicit)
6. `kubb.config.cjs` (CommonJS format)
7. `.kubbrc` (JavaScript format)

**Alternative locations:**

- `configs/kubb.config.ts` (in a configs directory)
- `.config/kubb.config.ts` (in a .config directory)

**Why use TypeScript configuration?**

- Full type checking catches errors before runtime
- IntelliSense autocomplete in VS Code and other editors
- Inline documentation for all options
- Easier refactoring and maintenance

> [!TIP]
> Use TypeScript (`kubb.config.ts`) for the best developer experience with type safety and autocomplete.

## defineConfig

The `defineConfig` helper provides TypeScript type checking and IntelliSense for your configuration. It also **automatically applies sensible defaults** so you don't have to configure them yourself:

| Option    | Default        | Package             |
| :-------- | :------------- | :------------------ |
| `adapter` | `adapterOas()` | `@kubb/adapter-oas` |
| `parsers` | `[parserTs]`   | `@kubb/parser-ts`   |

> [!NOTE]
> `@kubb/adapter-oas` and `@kubb/parser-ts` must be installed for the defaults to work. They are included when you run `npx kubb init` or install `@kubb/core`.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

// adapter and parsers are applied automatically — no need to set them
export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: { path: "./src/gen" },
  plugins: [],
});
```

You can always override the defaults explicitly:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { adapterOas } from "@kubb/adapter-oas";
import { parserTs, tsxParser } from "@kubb/parser-ts";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: { path: "./src/gen" },
  adapter: adapterOas({ validate: true }),
  parsers: [parserTs, tsxParser],
  plugins: [],
});
```

**Function form** - Access CLI arguments:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig(({ config, watch, logLevel }) => {
  return {
    input: { path: "./petStore.yaml" },
    output: {
      path: "./src/gen",
      clean: !watch, // Don't clean in watch mode
    },
    plugins: [],
  };
});
```

## Configuration Options

Configure Kubb's behavior with these options. All are optional unless marked as required.

### name

Display name for this configuration in CLI output. Useful when running multiple configs.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `false`  |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  name: "petStore", // Shows 'Generating petStore...' in CLI
  input: { path: "./petStore.yaml" },
  output: { path: "./src/gen" },
});
```

### root

Project root directory - can be absolute or relative to the config file location.

|           |                 |
| --------: | :-------------- |
|     Type: | `string`        |
| Required: | `false`         |
|  Default: | `process.cwd()` |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  root: ".", // Relative to kubb.config.ts location
  input: { path: "./petStore.yaml" },
  output: { path: "./src/gen" },
});
```

### input

OpenAPI specification source. Use either `input.path` or `input.data` (not both).

#### input.path

Path to your OpenAPI file - absolute or relative to `root`.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `true`\* |

> [!NOTE]
> Required if `input.data` is not provided.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: {
    path: "./petStore.yaml", // or .json, or a URL
  },
  output: { path: "./src/gen" },
});
```

#### input.data

OpenAPI specification as a string or object. Useful for programmatic generation.

|           |                     |
| --------: | :------------------ |
|     Type: | `string \| unknown` |
| Required: | `true`\*            |

> [!NOTE]
> Required if `input.path` is not provided.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

// You can import a JSON file and pass it as data
export default defineConfig({
  input: {
    data: {
      /* your OpenAPI spec object */
    },
  },
  output: { path: "./src/gen" },
});
```

### output

Controls where and how files are generated.

#### output.path

Directory for generated files - absolute or relative to `root`.

|           |          |
| --------: | :------- |
|     Type: | `string` |
| Required: | `true`   |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen", // All generated files go here
  },
});
```

#### output.clean

Remove the output directory before generating new files.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

> [!WARNING]
> This deletes the entire `output.path` directory. Only use with dedicated output folders.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    clean: true, // Deletes ./src/gen before generating
  },
});
```

#### output.format

Code formatter to use on generated files.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'auto' \| 'prettier' \| 'biome' \| false` |
| Required: | `false`                                    |
|  Default: | `'prettier'`                               |

- `'auto'` - Automatically detect and use available formatter (checks for biome, oxfmt then prettier)
- `'prettier'` - Format with [Prettier](https://prettier.io/) (default, included since v3.17.1)
- `'biome'` - Format with [Biome](https://biomejs.dev/)
- `'oxfmt'` - Format with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter)
- `false` - Skip formatting

> [!NOTE]
> Kubb respects your local `.prettierrc` or `biome.json` configuration files.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    format: "auto", // Automatically detect and use available formatter
  },
});
```

#### output.lint

Linter to run on generated files.

|           |                                                      |
| --------: | :--------------------------------------------------- |
|     Type: | `'auto' \| 'eslint' \| 'biome' \| 'oxlint' \| false` |
| Required: | `false`                                              |
|  Default: | `false`                                              |

- `'auto'` - Automatically detect and use available linter (checks for biome, oxlint, then eslint)
- `'eslint'` - Lint with [ESLint](https://eslint.org/)
- `'biome'` - Lint with [Biome](https://biomejs.dev/)
- `'oxlint'` - Lint with [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- `false` - Skip linting (default)

> [!WARNING]
> Linting large outputs can slow down generation. Consider running linters separately in CI.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    format: "biome",
    lint: "auto", // Automatically detect and use available linter
  },
});
```

#### output.write

Set to `false` for a dry-run — files are generated in memory but nothing is persisted.

> [!WARNING]
> **Deprecated.** Use `output.storage` instead. To disable writing, pass `write: false` — this remains supported for backwards compatibility.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    write: false, // dry-run — nothing written to disk
  },
});
```

#### output.storage

Where generated files are persisted. Defaults to `fsStorage()` — the built-in filesystem driver — which preserves the existing on-disk behavior.

Use `createStorage` to create a custom driver for any backend (S3, Redis, in-memory, etc.).

|           |               |
| --------: | :------------ |
|     Type: | `Storage`     |
| Required: | `false`       |
|  Default: | `fsStorage()` |

```typescript twoslash [kubb.config.ts]
// @noErrors
import { defineConfig, fsStorage } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    storage: fsStorage(), // explicit — same as the default
  },
});
```

**Custom storage** — use `createStorage` to implement storage for any backend:

```typescript twoslash [kubb.config.ts]
// @noErrors
import { defineConfig, createStorage } from "@kubb/core";

export const memoryStorage = createStorage(() => {
  const store = new Map<string, string>();

  return {
    name: "memory",
    async hasItem(key) {
      return store.has(key);
    },
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
    async getKeys(base) {
      const keys = [...store.keys()];
      return base ? keys.filter((k) => k.startsWith(base)) : keys;
    },
    async clear(base) {
      if (base) {
        for (const k of store.keys()) {
          if (k.startsWith(base)) store.delete(k);
        }
      } else {
        store.clear();
      }
    },
  };
});

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    storage: memoryStorage(),
  },
});
```

#### output.extension

Override file extensions in generated imports/exports. Useful for ESM compatibility.

|           |                                              |
| --------: | :------------------------------------------- |
|     Type: | `Record<KubbFile.Extname, KubbFile.Extname>` |
| Required: | `false`                                      |
|  Default: | `{ '.ts': '.ts' }`                           |

> [!TIP]
> Use `{ '.ts': '.js' }` for ESM compatibility when converting TypeScript to JavaScript.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    extension: {
      ".ts": ".js", // Import as .js instead of .ts
    },
  },
});
```

#### output.barrelType

Controls generation of barrel files (`index.ts`). This sets the root barrel file behavior.

|           |                             |
| --------: | :-------------------------- |
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

- `'all'` - Export everything with `export *`
- `'named'` - Export named exports only
- `false` - Don't create barrel files

> [!NOTE]
> Individual plugins have their own `barrelType` option. This controls the root `src/gen/index.ts` file.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    barrelType: "all", // Export everything
  },
});
```

#### output.defaultBanner

Banner comment added to generated files. Indicates the file was auto-generated.

|           |                               |
| --------: | :---------------------------- |
|     Type: | `'simple' \| 'full' \| false` |
| Required: | `false`                       |
|  Default: | `'simple'`                    |

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
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    defaultBanner: "full", // Include full API details
  },
});
```

#### output.override

Overrides existing external files that Kubb can generate if they already exist. All plugins inherit this behavior from the global configuration by default. Individual plugins can override this behavior using their own `output.override` option.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  input: { path: "./petStore.yaml" },
  output: {
    path: "./src/gen",
    override: true,
    // If external files that can be generated by Kubb are referenced in the config,
    // they will be overridden
  },
});
```

### plugins

|           |                         |
| --------: | :---------------------- |
|     Type: | `Array<KubbUserPlugin>` |
| Required: | `false`                 |

An array of Kubb plugins used for generation. Each plugin may have additional configurable options (defined within the plugin itself). If a plugin relies on another plugin, an error will occur if the required dependency is missing. Refer to “pre” for more details.
How to use and set up plugins, see [plugins](/guide/plugins/).

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  plugins: [
    pluginOas({
      output: {
        path: "schemas",
      },
      validate: true,
    }),
  ],
});
```

### adapter

|           |                                         |
| --------: | :-------------------------------------- |
|     Type: | `Adapter`                               |
| Required: | `false`                                 |
|  Default: | `adapterOas()` from `@kubb/adapter-oas` |

The adapter converts your input file into a `@kubb/ast` `RootNode` — the universal intermediate representation consumed by all Kubb plugins.

When this option is omitted, Kubb automatically uses `adapterOas()` (OpenAPI / Swagger) as the default, provided `@kubb/adapter-oas` is installed. Supply a different adapter for non-OAS formats.

See [`@kubb/adapter-oas`](/adapters/adapter-oas) for all available options.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { adapterOas } from "@kubb/adapter-oas";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  adapter: adapterOas({ validate: true }),
});
```

### parsers

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `Array<Parser>`                     |
| Required: | `false`                             |
|  Default: | `[parserTs]` from `@kubb/parser-ts` |

An array of parsers that convert generated files to strings before they are written to disk. Each parser declares which file extensions it handles via `extNames`. A built-in catch-all fallback is always registered last for any unhandled extensions.

When this option is omitted, Kubb automatically uses `[parserTs]` from `@kubb/parser-ts`, which handles `.ts` and `.js` files. Import additional parsers (e.g. `tsxParser` for `.tsx`/`.jsx`) to extend the defaults.

See [`@kubb/parser-ts`](/helpers/parser-ts) for the available parsers and [`defineParser`](/helpers/parser-ts#defineparser) for creating custom ones.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { parserTs, tsxParser } from "@kubb/parser-ts";

export default defineConfig({
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
  },
  parsers: [parserTs, tsxParser],
  plugins: [],
});
```

## Examples

### Basic

> [!TIP]
> When using an `import` statement you need to set `"type": "module"` in your `package.json`.
> You can also rename your file to `kubb.config.mts` or `kubb.config.mjs` to use ESM, or `kubb.config.cts` / `kubb.config.cjs` for CJS. Users migrating to `"moduleResolution": "bundler"` (e.g. TypeScript 6) can use `.mts` or `.cts` extensions.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
});
```

### Conditional

Export the config as a function when it needs to be conditionally determined based on CLI flags. The function can return config options synchronously or asynchronously.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";

export default defineConfig(({ config, watch, logLevel }) => {
  return {
    root: ".",
    input: {
      path: "./petStore.yaml",
    },
    output: {
      path: "./src/gen",
      clean: true,
    },
  };
});
```

### Multiple plugins

> [!TIP]
> With version `2.x.x` or higher we also support using multiple versions of the same plugin.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";

export default defineConfig(() => {
  return {
    root: ".",
    input: {
      path: "./petStore.yaml",
    },
    output: {
      path: "./src/gen",
    },
    plugins: [
      pluginOas({
        output: {
          path: "schemas",
        },
      }),
      pluginOas({
        output: {
          path: "schemas2",
        },
      }),
    ],
  };
});
```

### Multiple configs

> [!TIP]
> Since version `2.x.x` or higher we also support using multiple configs.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";

export default defineConfig([
  {
    name: "petStore",
    root: ".",
    input: {
      path: "./petStore.yaml",
    },
    output: {
      path: "./src/gen",
    },
    plugins: [
      pluginOas({
        output: {
          path: "schemas",
        },
      }),
    ],
  },
  {
    name: "petStoreV2",
    root: ".",
    input: {
      path: "./petStoreV2.yaml",
    },
    output: {
      path: "./src/gen-v2",
    },
    plugins: [
      pluginOas({
        output: {
          path: "schemas",
        },
      }),
    ],
  },
]);
```
