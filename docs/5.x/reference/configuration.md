---
layout: doc
title: kubb.config.ts - Configuration reference
description: Reference for kubb.config.ts in Kubb v5. How Kubb finds and loads the config, the defaults defineConfig applies, and every top-level and output option.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Configuration
  icon: i-iconoir-settings
---

# Configuration

`kubb.config.ts` default-exports a `defineConfig` call that tells Kubb what to read, where to write, and which plugins to run.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  name: 'petStore',
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs()],
})
```

## How Kubb loads a config

Kubb loads the `--config` file, or else the first `kubb.config.ts` or variant, such as `.kubbrc.ts`, in the working folder or a parent. Without one, the CLI suggests `kubb init`. See [Config loading](EDGE:config-loading).

## Config formats

`defineConfig` accepts an object, a Promise of one, an array, or a function that returns any of these.

### Config function

Pass a function when the config depends on how Kubb runs, such as watch mode:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig(({ watch }) => ({
  input: './petStore.yaml',
  output: { path: './src/gen', clean: !watch },
}))
```

The function receives the CLI context:

| Field | Type | Value |
| --- | --- | --- |
| `input` | `string \| undefined` | The positional input of `kubb generate <input>`. It overrides `config.input`. |
| `watch` | `boolean \| undefined` | `true` in watch mode |
| `logLevel` | `'silent' \| 'info' \| 'verbose' \| undefined` | The current log level |
| `reporters` | `Array<ReporterName> \| undefined` | The `--reporter` names, such as `['json']` |
| `config` | `string \| undefined` | The `--config` value, `undefined` when the CLI found the file |

### Multiple configurations (array)

Pass an array to generate from several specs in one run. A config function can return an array too.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig([
  { name: 'petStore', input: './petStore.yaml', output: { path: './src/gen/petStore' }, plugins: [pluginTs()] },
  { name: 'stripe', input: './stripe.yaml', output: { path: './src/gen/stripe' }, plugins: [pluginTs()] },
])
```

## Defaults {#defaults}

`defineConfig` from `kubb/config` and `createKubb` from `kubb` fill in these defaults for every option you leave out.

| Option | Default |
| --- | --- |
| [`name`](#name) | None |
| [`input`](#input) | None. Required with an adapter. |
| [`output.path`](#outputpath) | None. Required. |
| [`output.clean`](#outputclean) | `false` |
| [`output.format`](#outputformat) | `false` |
| [`output.lint`](#outputlint) | `false` |
| [`output.postGenerate`](#outputpostgenerate) | None |
| [`output.barrel`](#outputbarrel) | `false`, so no root `index.ts`. Plugins keep their own default barrel. |
| [`output.defaultBanner`](#outputdefaultbanner) | `'simple'` |
| [`plugins`](#plugins) | `pluginBarrel()`, appended when the array does not include it |
| [`adapter`](#adapter) | `adapterOas()` from the bundled [OpenAPI adapter](/extensions/kubb-labs/adapter-oas) |
| [`parsers`](#parsers) | `[parserTs(), parserTsx(), parserMd()]` |
| [`storage`](#storage) | `fsStorage()` |
| [`root`](#root) | The config file's folder. `process.cwd()` when you call `createKubb` yourself. |
| [`reporters`](#reporters) | `[cli, json, file, html]` |

`createKubb` from `@kubb/core` applies fewer defaults, and the build tool integrations run fewer reporters. See [Config loading](EDGE:config-loading).

## Top-level options

::field-group

### `name`

:::field{type="string"}
A label the CLI prints as the run heading, before the input, such as `petStore ./petStore.yaml`. An unnamed config shows as `kubb`.
:::

### `input`

:::field{type="string | Record<string, unknown>" required}
Where Kubb reads your spec. Kubb detects the kind from the value:

| Value | Read as |
| --- | --- |
| An object | An already-parsed spec |
| A string that starts with `{` or `[`, spans lines, or opens with `openapi:` or `swagger:` | Inline JSON or YAML |
| A string that starts with `git+` | A file in a git repository |
| A string that parses as a URL | A remote spec |
| Any other string | A file path, relative to [`root`](#root) |

A git input is `git+<repo>#<ref>:<path>`, where `<ref>` is a branch or a tag. Leave out `<ref>:` to use the default branch. Kubb needs `git` on the `PATH` and uses your git credentials for a private repository.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: 'git+https://github.com/org/api.git#v2:specs/openapi.yaml',
  output: { path: './src/gen' },
})
```

See [Git input](EDGE:git-input) for commit SHAs, and [External `$ref` files](EDGE:external-refs) for how `$ref` files resolve.
:::

### `output`

Where and how Kubb writes files. `output.mode`, `output.banner`, and `output.footer` are [plugin options](/docs/5.x/reference/plugin-options#output) only.

#### `output.path`

:::field{type="string" required}
The folder for generated files, absolute or relative to `root`. Plugin output paths resolve inside it.
:::

#### `output.clean`

:::field{type="boolean"}
Remove every file in `output.path` before generating. Default: `false`.

> [!WARNING]
> Use `clean: true` only on a folder of generated code. Kubb stops with [`KUBB_CLEAN_ROOT`](/docs/5.x/reference/diagnostics#kubb-clean-root) when `output.path` is the project root or a parent of it.
:::

#### `output.format`

:::field{type="'auto' | 'prettier' | 'biome' | 'oxfmt' | false"}
The formatter to run over the generated files. Default: `false`.

`'auto'` runs the first one installed: oxfmt, then Biome, then Prettier. A tool name forces that tool, which reads its own config file.
:::

#### `output.lint`

:::field{type="'auto' | 'eslint' | 'biome' | 'oxlint' | false"}
The linter to run over the generated files. Default: `false`.

`'auto'` runs the first one installed: oxlint, then Biome, then ESLint. A tool name forces that tool.
:::

#### `output.postGenerate`

:::field{type="Array<string | { name?: string; command: string }>"}
Commands to run in order from `root` after formatting and linting, such as a type check. `{ name, command }` labels a step in the CLI output.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.yaml',
  output: {
    path: './src/gen',
    postGenerate: [{ name: 'types', command: 'npm run typecheck' }, 'biome check --write ./src/gen'],
  },
})
```

Format, lint, and `postGenerate` run only after a build without errors. A failing step reports [`KUBB_FORMAT_FAILED`](/docs/5.x/reference/diagnostics#kubb-format-failed), [`KUBB_LINT_FAILED`](/docs/5.x/reference/diagnostics#kubb-lint-failed), or [`KUBB_POST_GENERATE_FAILED`](/docs/5.x/reference/diagnostics#kubb-post-generate-failed).
:::

#### `output.barrel`

:::field{type="{ type: 'all' | 'named' } | false"}
The root `index.ts` at `output.path`. Default: `false`.

`{ type: 'named' }` re-exports each symbol by name, and `{ type: 'all' }` writes `export *`. A plugin without its own `output.barrel` inherits this value. See the plugin-level [`output.barrel`](/docs/5.x/reference/plugin-options#output-barrel) and the [Barrel files](/docs/5.x/how-to/recipes#barrel-files) recipe.
:::

#### `output.defaultBanner`

:::field{type="'simple' | 'full' | false"}
The notice Kubb writes at the top of each generated file. Default: `'simple'`. A plugin's [`output.banner`](/docs/5.x/reference/plugin-options#output-banner) replaces it.

::::code-group

```typescript [simple]
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */
```

```typescript [full]
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 * Source: petStore.yaml
 * Title: Pet Store
 * OpenAPI spec version: 1.0.0
 */
```

```typescript [false]
// no banner
```

::::
:::

### `plugins`

:::field{type="Array<Plugin>"}
The plugins to run, in dependency order. A missing required dependency fails the run with [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency). See [Shared plugin options](/docs/5.x/reference/plugin-options) for the options every generator plugin takes.
:::

### `adapter`

:::field{type="Adapter"}
Converts your input into Kubb's AST. Default: `adapterOas()`, bundled with `kubb`.

To pass options, such as `adapter: adapterOas({ validate: false })`, install `@kubb/adapter-oas` for the import: `kubb` depends on it but does not re-export it. See the [adapter options](/extensions/kubb-labs/adapter-oas/options).
:::

### `parsers`

:::field{type="Array<Parser>"}
Turn generated file nodes into source text, each for the file extensions in its `extNames`. Default: `[parserTs(), parserTsx(), parserMd()]`, bundled with `kubb`. A list you pass replaces the default. See [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts).

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserTs, parserTsx } from '@kubb/parser-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx()],
})
```
:::

### `storage`

:::field{type="Storage"}
Where generated files go. Default: `fsStorage()`, which writes to disk. `memoryStorage()` from `kubb/kit` keeps them in memory. See [Storage](/docs/5.x/explanation/architecture#storage) for a custom backend.
:::

### `root`

:::field{type="string"}
The project root that `input` and `output.path` resolve against. Default: the config file's folder. A relative `root` resolves from that folder.

See [Config loading](EDGE:config-loading) for a config in `.config/` and for `createKubb`.
:::

### `reporters`

:::field{type="Array<Reporter>"}
The reporters a run can use. Default: the built-in `cli`, `json`, `file`, and `html` reporters. The [`--reporter`](/docs/5.x/reference/commands/generate#reporters) flag picks which ones run and defaults to `cli`.
:::

::

::studio-cta{source="configuration-reference"}
::
