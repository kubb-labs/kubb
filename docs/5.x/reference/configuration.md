---
layout: doc
title: Configuration
description: Reference for kubb.config.ts with every option, default and example
  for the Kubb v5 UserConfig.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Configuration
  icon: i-iconoir-settings
---

# Configuration

`kubb.config.ts` drives a Kubb run. The file default-exports a `defineConfig` call. Pass it an object, a function that returns one, or an array of configs.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  name: 'petStore',
  input: './petStore.yaml',
  output: { path: './src/gen' },
})
```

## Config formats

### Single config object

Export an object as in the example above. `defineConfig` also accepts a Promise of a config.

### Config function

Pass a function when the config depends on the run context, such as `watch` or `logLevel`:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig(({ watch, logLevel }) => ({
  name: 'petStore',
  input: './petStore.yaml',
  output: { path: './src/gen', clean: !watch },
}))
```

The function receives this context:

|             | Type | Description |
| ----------: | :--- | :---------- |
|     `input` | `string` | Positional input from `kubb generate <input>`. Overrides `config.input` when set. |
|     `watch` | `boolean` | `true` in watch mode. |
|  `logLevel` | `'silent' \| 'info' \| 'verbose'` | Current log level. |
|    `config` | `string` | Path to the config file in use. |
| `reporters` | `Array<ReporterName>` | Reporters selected via `--reporter`, overriding `config.reporters`. |

### Multiple configurations (array)

Pass an array to generate from several specs in one command:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig([
  {
    name: 'petStore',
    input: './petStore.yaml',
    output: { path: './src/gen/petStore' },
    plugins: [pluginTs()],
  },
  {
    name: 'stripe',
    input: './stripe.yaml',
    output: { path: './src/gen/stripe' },
    plugins: [pluginTs()],
  },
])
```

A config function can return an array to combine both forms.

## Defaults {#defaults}

`defineConfig` from `kubb/config` and `createKubb` from `kubb` fill in these fields when you omit them. The bare `@kubb/core` engine applies none of them.

| Field            | Default |
| ---------------- | ------- |
| `root`           | `process.cwd()` |
| `adapter`        | `adapterOas()` from the bundled [OpenAPI adapter](/extensions/kubb-labs/adapter-oas) |
| `parsers`        | `[parserTs(), parserTsx(), parserMd()]` |
| `reporters`      | `[cli, json, file, html]` |
| `plugins`        | `pluginBarrel()` appended when not already present |
| `storage`        | `fsStorage()` |
| `output.barrel`  | `false`, so `pluginBarrel` generates nothing until you opt in |
| `output.format`  | `false` |
| `output.lint`    | `false` |
| `output.defaultBanner` | `'simple'` |

Bundler integrations apply a smaller set: no `parserMd` and no reporters. See [Build tools](/docs/5.x/integrations/overview#build-tools).

## Top-level options

::field-group

### `name`

:::field{type="string"}
A name for this config. The CLI prints it as `Generating <name>...`.
:::

### `input`

:::field{type="string | Record<string, unknown>"}
Where Kubb reads your spec: a local file path, a URL, a file in a git repository, inline OpenAPI content as a JSON or YAML string, or an already-parsed object. Kubb detects which one you gave it. Required when an adapter is configured. Omit it in plugin-only mode, when there is no `adapter`.

A string that starts with `{` or `[`, spans multiple lines, or opens with a YAML `openapi:` or `swagger:` key is read as inline content. A string that starts with `git+` is a git input. Anything else is a file path or a URL, and a relative path resolves against the config file. Relative `$ref` files in inline content or a parsed object resolve against `root`.

Write a git input as `git+<repo>#<ref>:<path>`. `<ref>` is a branch, a tag, or a full commit SHA when the host allows fetching by SHA (GitHub and GitLab do); leave out `<ref>:` to use the default branch. Kubb runs a shallow `git fetch` into a temporary folder, so it needs `git` on the `PATH`, works with any host, and uses your own git credentials (credential helper or SSH key) for a private repository. Relative `$ref` files in the repository resolve as usual.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: 'git+https://github.com/org/api.git#v2:specs/openapi.yaml',
  output: { path: './src/gen' },
})
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  // a path, a URL, a git input, an inline JSON/YAML string, or a parsed object
  input: './petStore.yaml',
  output: { path: './src/gen' },
})
```
:::

### `output`

Controls where and how files are written.

#### `output.path`

:::field{type="string" required}
Directory for generated files, absolute or relative to `root`.
:::

#### `output.mode`

:::field{type="'file' | 'directory'"}
How a plugin consolidates its code into files. Set it on a plugin's `output`, not on the root `output`.

Default: follows the shape of `output.path`.

`'file'` writes everything into a single file, so `output.path` must include the extension (`'types.ts'`). `'directory'` writes one file per operation or schema under `output.path`. Pair `'directory'` with `group` to split the output into per-tag or per-path subdirectories.

You rarely need to set this. Leave it out and Kubb reads `output.path`: a path with an extension means one file, a path without one means a directory. Every plugin ships an extensionless default such as `'types'` or `'clients'`, so `pluginTs()` writes a directory without any configuration.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petstore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs({ output: { path: 'types.ts' } }),
    pluginAxios({ output: { path: 'clients', mode: 'directory' }, group: { type: 'tag' } }),
  ],
})
```

This writes every type into `src/gen/types.ts` and one client file per operation, grouped by tag (`src/gen/clients/pet/`, `src/gen/clients/store/`).

> [!TIP]
> `group` works with the inferred directory mode, no `mode` needed. Set `mode: 'directory'` yourself only to override the inference, such as a directory name that carries a dot (`path: 'clients.v2'`). An explicit `mode: 'file'` still forbids `group` and stops the build with a `KUBB_INVALID_PLUGIN_OPTIONS` error, because a single file has nothing to group.
:::

#### `output.clean`

:::field{type="boolean"}
Wipe `output.path` before regenerating.

Default: `false`.

> [!WARNING]
> Only use `clean: true` with a dedicated output folder. Kubb removes the entire directory.
:::

#### `output.format`

:::field{type="'auto' | 'prettier' | 'biome' | 'oxfmt' | false"}
Formatter to run on every generated file.

Default: `false`.

`'auto'` detects the first formatter it finds ([oxfmt](https://oxc.rs) then [Biome](https://biomejs.dev) then [Prettier](https://prettier.io)). A named tool forces that one. `false` skips formatting. Kubb reads your local `.prettierrc` or `biome.json`.
:::

#### `output.lint`

:::field{type="'auto' | 'eslint' | 'biome' | 'oxlint' | false"}
Linter to run after generation.

Default: `false`.

`'auto'` detects the first linter it finds ([oxlint](https://oxc.rs) then [Biome](https://biomejs.dev) then [ESLint](https://eslint.org)). A named tool forces that one. `false` skips linting.
:::

#### `output.postGenerate`

:::field{type="Array<string | { name?: string; command: string }>"}
Shell commands to run after the generated files are formatted and linted, such as a type check or a custom script. Commands run from the `root` directory, in sequence. Pass a command string, or `{ name, command }` to label a step in the CLI output.


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
:::

#### `output.barrel`

:::field{type="{ type: 'all' | 'named' } | false"}
Behavior of the root `index.ts` barrel file at `output.path`, and the default every plugin inherits.

Default: `false`.

`{ type: 'named' }` re-exports each symbol by name, `{ type: 'all' }` writes `export *`. See [`@kubb/plugin-barrel` options](/extensions/kubb-labs/plugin-barrel/options#outputbarrel) for the export styles and the plugin-level `nested` flag, and [Add barrel files](/docs/5.x/how-to/barrel-files) for the setup steps.
:::

#### `output.defaultBanner`

:::field{type="'simple' | 'full' | false"}
Auto-generated banner injected at the top of each file.

Default: `'simple'`.

`'simple'` adds a short "Generated by Kubb" notice. `'full'` adds the notice plus `Source`, `Title`, and `OpenAPI spec version` from the spec. `false` writes no banner.

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

#### `output.banner`

:::field{type="string | ((meta: BannerMeta) => string)"}
Text prepended to every file a plugin generates. Set it on an individual plugin. The root `output` exposes only [`output.defaultBanner`](#outputdefaultbanner). Use it for license headers, lint-disable comments, or framework directives like `'use server'`.


A string applies to every file the plugin generates, including barrel (`index.ts`) and group aggregation (`[dir]/[dir].ts`) re-export files. A function runs once per file and receives a `BannerMeta`, so you can vary the banner per file or return an empty string to skip it.

`BannerMeta` extends the document `InputMeta` (`title`, `description`, `version`, …) with per-file context:

|              |           |                                                          |
| -----------: | :-------- | :------------------------------------------------------- |
|   `filePath` | `string`  | Full output path of the file being generated.            |
|   `baseName` | `string`  | File name only, for example `stocks.ts`.                 |
|   `isBarrel` | `boolean` | `true` for `index.ts` re-export barrels.                 |
| `isAggregation` | `boolean` | `true` for group `[dir]/[dir].ts` aggregation files. |


> [!NOTE]
> Barrel `index.ts` files stay banner-free by default. They get a banner only when the plugin sets `output.banner`, at which point the function runs with `isBarrel: true`.
:::

#### `output.footer`

:::field{type="string | ((meta: BannerMeta) => string)"}
Text appended to the end of every file a plugin generates. Mirror of [`output.banner`](#outputbanner), with the same `string | ((meta: BannerMeta) => string)` type.
:::

### `plugins`

:::field{type="Array<Plugin>"}
Array of Kubb plugins. Dependencies run first. A plugin that requires one missing from this array fails the run with `KUBB_MISSING_DEPENDENCY`.
:::

### `adapter`

:::field{type="Adapter"}
Adapter that converts your input into the universal AST. With `defineConfig` from the `kubb` package this defaults to `adapterOas()` from [`@kubb/adapter-oas`](/extensions/kubb-labs/adapter-oas).

See the [Adapter concept](/docs/5.x/explanation/architecture#adapters) for the full picture.

Default: `adapterOas()` (included with `kubb`).

Pass options to customize the adapter:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  adapter: adapterOas({ validate: true }),
})
```
:::

### `parsers`

:::field{type="Array<Parser>"}
Array of parsers that turn the in-memory file representation into source code. Each parser declares which file extensions it handles through `extNames`.

See the [Parser concept](/docs/5.x/explanation/architecture#parsers) and [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts) for the built-in parsers.

Default: `[parserTs(), parserTsx(), parserMd()]` (included with `kubb`).

Import parsers explicitly to override the default set:

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
Storage driver that persists generated files. Defaults to `fsStorage()` (filesystem).

See the [Storage concept](/docs/5.x/explanation/architecture#storage) for the built-in drivers and how to write a custom backend.

Default: `fsStorage()`.


```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { memoryStorage } from 'kubb/kit'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  storage: memoryStorage(),
})
```
:::

### `root`

:::field{type="string"}
Project root, absolute or relative to the config file location.

Default: `process.cwd()`.
:::

### `reporters`

:::field{type="Array<Reporter>"}
Reporters available to the run, registered as instances. `defineConfig` registers the built-in `cli`, `json`, `file`, and `html` reporters by default. The HTML reporter remains opt-in: select it with [`--reporter html`](/docs/5.x/reference/commands/generate#reporters). The CLI [`--reporter`](/docs/5.x/reference/commands/generate#reporters) flag selects reporters by name and defaults to `cli`. See that page for details about each reporter.

Default: `[cli, json, file, html]`.
:::

::

::studio-cta{source="configuration-reference"}
::
