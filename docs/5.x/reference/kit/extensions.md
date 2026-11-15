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

Plugins, adapters, and parsers are extensions. `defineExtension` from `kubb/kit` takes a definition object and returns a factory. The config calls that factory with the user's options.

## `defineExtension` {#define-extension}

`kind` picks what the definition defines. The other fields follow from it:

|                    | Plugin                                                   | Adapter                                                         | Parser                                                                       |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `kind`             | `'plugin'`                                               | `'adapter'`                                                     | `'parser'`                                                                   |
| Config field       | `plugins`                                                | `adapter`                                                       | `parsers`                                                                    |
| Definition fields  | `meta`, `setup`, `dependencies`, `enforce`, `hooks`      | `meta`, `setup`, `build`                                        | `meta`, `build`                                                              |
| Receives           | The user's options and the [setup context](/docs/5.x/reference/kit/plugins#setup-context) | `setup` gets the user's options. `build` gets what `setup` returns. | The user's options, or `{}`                                                  |
| Returns            | The resolved options, from `setup`                       | The document and its methods, from `build`                      | The parser methods, from `build`                                             |
| Runs               | Once per build, after the adapter parses the input. Its generators then walk every node. | First. `parse` turns the input into an `InputNode`. | Last. `parse` prints each file as Kubb writes it. Plugins call `print` while they generate. |
| Deprecated factory | `definePlugin`                                           | `createAdapter`                                                 | `defineParser`                                                               |
| Details            | [Plugins](/docs/5.x/reference/kit/plugins)                                      | [Adapters](/docs/5.x/reference/kit/adapters)                                           | [Parsers](/docs/5.x/reference/kit/parsers)                                                          |

> [!WARNING]
> `definePlugin`, `createAdapter`, and `defineParser` are deprecated. They take the same object without `kind`. Call `defineExtension` and add the `kind` instead.

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
| `name`          | `string`                           | Required. Unique name, such as `'plugin-ts'`. The extension takes its `name` from it.                             |
| `version`       | `string`                           | Package version. [Dependents](#dependencies) check their `version` range against it.                              |
| `displayName`   | `string`                           | Human-readable name, such as `'TypeScript'`.                                                                      |
| `description`   | `string`                           | One sentence on what the extension generates or does.                                                             |
| `category`      | `string`                           | Registry category, such as `'types'` or `'client'`.                                                               |
| `icon`          | `{ light: string; dark?: string }` | Icon URLs, with an optional variant for dark backgrounds.                                                         |
| `media`         | `Array<string>`                    | Screenshots or videos, as HTTPS URLs.                                                                             |
| `tags`          | `Array<string>`                    | Search keywords for the registry.                                                                                 |
| `compatibility` | `{ kubb?: string; node?: string }` | Semver ranges for `@kubb/core` and Node.js. See [compatibility checks](#compatibility-checks).                    |
| `docs`          | `string`                           | URL of the extension's docs page.                                                                                 |
| `issues`        | `string`                           | URL of the issue tracker. Kubb prints it as the `report:` link when the extension crashes.                        |

Import `version` from `package.json` and `compatibility` [from `kubb-extension.json`](/docs/5.x/reference/kit/manifest#import-compatibility-into-meta), so each lives in one file. Named JSON imports need a bundler that inlines them, such as tsdown.

### Compatibility checks

Before any plugin runs, Kubb checks the `meta.compatibility` of the adapter, every parser, and every plugin against the running `@kubb/core` and Node.js. A mismatch fails with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension). Prereleases compare like releases, and a canary build (`0.0.0-canary-*`) skips the `kubb` range.

## `dependencies` {#dependencies}

Plugins only. `dependencies` lists the plugins this one builds on, keyed by `meta.name`. Kubb runs them first. Each entry sets how Kubb checks one:

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
| `version`   | `string`  | Semver range the dependency's `meta.version` must satisfy. Kubb skips the check when it has no `meta.version`. |
| `optional`  | `boolean` | When `true`, a missing plugin is skipped. An installed one still has its `version` checked.                   |

Kubb checks the records before any plugin runs:

| Problem                                       | Result                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A required entry is missing from the config   | Fails with [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency)                |
| An `optional: true` entry is missing          | Skipped                                                                                                       |
| A `meta.version` is outside the entry's range | Fails with [`KUBB_INCOMPATIBLE_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-incompatible-dependency)      |
| The dependencies form a cycle                 | Fails with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options)        |

To pick dependencies from the user's options, pass a function. It receives the options and `{ config }`, and returns the record:

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

> [!NOTE]
> An array, such as `dependencies: ['plugin-ts']`, still works. It only orders plugins: a missing one is skipped, and versions are not checked.

## Factory statics {#factory-statics}

Every factory carries `kind` and `meta`, so tools read them without calling it:

```typescript
pluginExample.kind // 'plugin'
pluginExample.meta.name // 'plugin-example'
```

The extension the factory returns gets `name` (from `meta.name`), `meta`, and the user's raw `options`. A hand-written plugin or parser object with only the deprecated `name` gets `meta: { name }`. One with neither fails with `KUBB_INVALID_PLUGIN_OPTIONS`.
