---
layout: doc
title: Extensions
description: defineExtension defines a plugin, an adapter, or a parser in
  kubb/kit. Covers kind, ExtensionMeta, compatibility ranges, plugin
  dependencies with version ranges, and the kind and meta that every extension
  factory carries.
outline:
  - 2
  - 3
order: 13
navigation:
  title: Extensions
  icon: i-iconoir-puzzle
---

# Extensions

Plugins, adapters, and parsers are all extensions. `defineExtension` takes a definition object with a `kind` and `meta`, and returns a factory that the config calls with the user's options. The fields on this page work the same for every kind.

## `defineExtension` {#define-extension}

`kind` picks what the definition defines, and the other fields follow that kind:

| `kind`      | Defines                                          | Other fields                                  | Reference                |
| ----------- | ------------------------------------------------ | --------------------------------------------- | ------------------------ |
| `'plugin'`  | A plugin that generates code from the AST.      | `setup`, `dependencies`, `enforce`, `hooks`   | [Plugins](./plugins)     |
| `'adapter'` | An adapter that reads the input into the AST.   | `setup`, `build`                              | [Adapters](./adapters)   |
| `'parser'`  | A parser that prints files to source text.      | `build`                                       | [Parsers](./parsers)     |

```typescript [plugin-example.ts]
import { defineExtension } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
})
```

> [!WARNING]
> `definePlugin`, `defineParser`, and `createAdapter` are deprecated. Each takes the same definition object as `defineExtension`, without `kind`. Pass the object to `defineExtension` and add `kind: 'plugin'`, `'parser'`, or `'adapter'`.

## `meta` {#meta}

`meta` holds the extension's identity and the Kubb and Node.js versions it supports. Kubb reads `name` and `compatibility` at runtime. Studio, the kubb.dev registry, and the docs read the rest.

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

| Property        | Type                                | Description |
| --------------- | ----------------------------------- | ----------- |
| `name`          | `string`                            | Unique name. The plugin's or parser's own `name` is deprecated in favor of it, and optional when `meta.name` is set. Required. |
| `version`       | `string`                            | Package version. Plugins that depend on this one check their `version` range against it. |
| `displayName`   | `string`                            | Human-readable name, such as `'TypeScript'`. |
| `description`   | `string`                            | One-sentence summary of what the extension generates or does. |
| `category`      | `string`                            | Registry category, such as `'types'` or `'client'`. |
| `icon`          | `{ light: string; dark?: string }`  | Icon URLs, with an optional variant for dark backgrounds. |
| `media`         | `Array<string>`                     | Screenshots or videos, as HTTPS URLs. |
| `tags`          | `Array<string>`                     | Search keywords for the registry. |
| `compatibility` | `{ kubb?: string; node?: string }`  | Semver ranges for `@kubb/core` and Node.js. |
| `docs`          | `string`                            | URL of the extension's docs page. |
| `issues`        | `string`                            | URL of the extension's issue tracker. When the extension crashes, Kubb prints it as the `report:` link, so users report the bug to you instead of to Kubb. |

Read `version` from your `package.json` so it stays in sync with what you publish:

```typescript
import { version } from '../package.json'
```

A package that ships a [`kubb-extension.json`](./manifest) imports `compatibility` from it, so the ranges live in one file. See [Import `compatibility` into `meta`](./manifest#import-compatibility-into-meta).

### Compatibility checks

Before any plugin runs, Kubb checks each plugin's and parser's `meta.compatibility` against the running `@kubb/core` and Node.js versions. A mismatch fails the run with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension), which names the extension and the version that is running. Kubb compares prerelease versions like regular ones.

## `dependencies` {#dependencies}

A plugin's `dependencies` lists the plugins it builds on, keyed by name. They run first when the config has them. Each entry decides what happens when a plugin is missing or has the wrong version:

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

| Entry field | Type      | Description |
| ----------- | --------- | ----------- |
| `version`   | `string`  | Semver range the dependency's `meta.version` must satisfy. Kubb skips the check when the dependency has no `meta.version`. |
| `optional`  | `boolean` | When `true`, a missing plugin is skipped. An installed one still has its `version` checked. |

Kubb checks the record before any plugin runs:

- A missing entry without `optional: true` fails with [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency).
- A `meta.version` outside the `version` range fails with [`KUBB_INCOMPATIBLE_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-incompatible-dependency).

When a dependency depends on the user's options, pass a function. It receives the options and returns the record:

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
> An array, such as `dependencies: ['plugin-ts']`, still works. It only orders plugins, so a missing one is skipped and versions are not checked.

## Factory statics

Every factory `defineExtension` returns carries `kind` (`'plugin'`, `'adapter'`, or `'parser'`) and `meta`, so tools can read an extension's metadata without calling the factory or knowing its options:

```typescript
pluginExample.kind // 'plugin'
pluginExample.meta.name // 'plugin-example'
```

A factory built from a deprecated factory function has no `meta` on it, because Kubb only learns it by calling the factory. The plugin or parser it returns still has `meta`, which falls back to `{ name }`.
