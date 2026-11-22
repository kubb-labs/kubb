---
layout: doc
title: defineExtension - Plugins, adapters, and parsers
description: defineExtension in kubb/kit defines a plugin, adapter, or parser. Covers meta, compatibility checks, plugin dependencies, and factory statics.
outline:
  - 2
  - 3
order: 13
navigation:
  title: Extensions
  icon: i-iconoir-puzzle
---

# Extensions

`defineExtension` from `kubb/kit` defines an extension: a plugin, an adapter, or a parser. You pass it a definition object, and it returns a factory. The config calls that factory with the user's options.

## `defineExtension` {#define-extension}

`kind` picks what you define. The other fields follow from it:

|                    | Plugin                                                   | Adapter                                                         | Parser                                                                       |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `kind`             | `'plugin'`                                               | `'adapter'`                                                     | `'parser'`                                                                   |
| Config field       | `plugins`                                                | `adapter`                                                       | `parsers`                                                                    |
| Definition fields  | `meta`, `setup`, `dependencies`, `enforce`, `hooks`      | `meta`, `setup`, `build`                                        | `meta`, `build`                                                              |
| Receives           | The user's options and the [setup context](/docs/5.x/reference/kit/plugins#setup-context) | `setup` gets the user's options. `build` gets what `setup` returns. | The user's options, or `{}`                                                  |
| Returns            | The resolved options, from `setup`                       | The document and its methods, from `build`                      | The parser methods, from `build`                                             |
| Runs               | Once per build, after the adapter                         | First                                                           | Last, as Kubb writes each file                                               |
| Details            | [Plugins](/docs/5.x/reference/kit/plugins)                                      | [Adapters](/docs/5.x/reference/kit/adapters)                                           | [Parsers](/docs/5.x/reference/kit/parsers)                                                          |

## `meta` {#meta}

`meta` holds the extension's identity. Kubb reads `name` and `compatibility` at runtime. Studio, the registry, and kubb.dev read the rest.

```typescript [plugin-example.ts]
import { defineExtension } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: {
    name: 'plugin-example',
    version: '1.0.0',
    displayName: 'Example',
    description: 'Adds a comment to every generated schema.',
    compatibility: { kubb: '>=5.7.0', node: '>=22' },
  },
})
```

| Field           | Type                               | Description                                                                                                       |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`          | `string`                           | Required. Unique name, such as `'plugin-ts'`.                                                                     |
| `version`       | `string`                           | Package version. [Dependents](#dependencies) check their range against it.                                        |
| `displayName`   | `string`                           | Human-readable name, such as `'TypeScript'`.                                                                      |
| `description`   | `string`                           | One sentence on what the extension generates or does.                                                             |
| `category`      | `string`                           | Registry category, such as `'types'` or `'client'`.                                                               |
| `icon`          | `{ light: string; dark?: string }` | Icon URLs for light and dark backgrounds.                                                                         |
| `media`         | `Array<string>`                    | Screenshots or videos, as HTTPS URLs.                                                                             |
| `tags`          | `Array<string>`                    | Search keywords for the registry.                                                                                 |
| `compatibility` | `{ kubb?: string; node?: string }` | Semver ranges for `@kubb/core` and Node.js. See [Compatibility checks](#compatibility-checks).                    |
| `docs`          | `string`                           | URL of the extension's docs page.                                                                                 |
| `issues`        | `string`                           | Issue tracker URL. Kubb prints it as the `report:` link when the extension crashes.                               |

Import `version` from `package.json` and `compatibility` from `kubb-extension.json`, so each lives in one file. [Import `compatibility` into `meta`](/docs/5.x/reference/kit/manifest#import-compatibility-into-meta) shows how. Named JSON imports need a bundler that inlines them, such as tsdown.

### Compatibility checks

Before any plugin runs, Kubb checks each extension's `meta.compatibility` against the running `@kubb/core` and Node.js. A mismatch fails with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension). [Compatibility ranges](#compatibility-ranges) covers prereleases and canary builds.

## `dependencies` {#dependencies}

Only plugins take `dependencies`: the plugins yours builds on, keyed by `meta.name`. Kubb runs them first.

```typescript [plugin-example.ts]
import { defineExtension } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  dependencies: {
    'plugin-ts': { version: '>=5.0.0' },
    'plugin-zod': { optional: true },
  },
})
```

| Entry field | Type      | Description                                                                                                  |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `version`   | `string`  | Semver range the dependency's `meta.version` must satisfy. Skipped when it has no `meta.version`.            |
| `optional`  | `boolean` | When `true`, a missing plugin is skipped. An installed one still gets its `version` checked.                  |

Kubb checks the record before any plugin runs:

| Problem                                       | Result                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A required entry is missing from the config   | Fails with [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency)                |
| An `optional: true` entry is missing          | Skipped                                                                                                       |
| A `meta.version` is outside the entry's range | Fails with [`KUBB_INCOMPATIBLE_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-incompatible-dependency)      |
| The dependencies form a cycle                 | Fails with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options)        |

To pick dependencies from the user's options, pass a function. It receives the options and `{ config }`:

```typescript [plugin-example.ts]
import { defineExtension, type PluginType } from 'kubb/kit'

type PluginExample = PluginType<'plugin-example', { parser?: 'data' | 'faker' }>

export const pluginExample = defineExtension<PluginExample>({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  dependencies: (options) => ({
    'plugin-ts': {},
    ...(options.parser === 'faker' ? { 'plugin-faker': {} } : {}),
  }),
})
```

[Array dependencies](#array-dependencies) covers the older array form.

## Factory statics {#factory-statics}

Every factory carries `kind` and `meta`, so a tool can read them without calling the factory:

```typescript
pluginExample.kind // 'plugin'
pluginExample.meta.name // 'plugin-example'
```

The extension the factory returns gets `name` (from `meta.name`), `meta`, and the user's raw `options`. See [Hand-written extensions](#hand-written-extensions).

## Less common cases {#less-common-cases}

### Compatibility ranges {#compatibility-ranges}

When a run fails with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension), an extension's `meta.compatibility` does not match the running `@kubb/core` or Node.js.

- `kubb add` checks it before it installs.
- Prereleases compare like releases.
- A canary build (`0.0.0-canary-*`) skips the `kubb` range.

### Array dependencies {#array-dependencies}

When a plugin declares [`dependencies`](#dependencies) as an array, such as `dependencies: ['plugin-ts']`, the array still works but only orders plugins.

| Form | A missing plugin | Versions |
| --- | --- | --- |
| An array of plugin names | Skipped. It never raises `KUBB_MISSING_DEPENDENCY`. | Not checked |
| A record keyed by plugin name | A missing required plugin fails the run before any plugin runs. | Out of range fails the run before any plugin runs. A dependency without `meta.version` is not checked. |

Both forms set the order. Use the record form to fail early when a required plugin is missing or out of range.

### Hand-written extensions {#hand-written-extensions}

When you write a plugin or parser object by hand instead of calling a factory, give it `meta`.

- An object without `meta` fails with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options).
