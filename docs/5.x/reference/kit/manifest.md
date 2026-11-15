---
layout: doc
title: Extension manifest
description: Reference for kubb-extension.json, the manifest a Kubb plugin,
  adapter, or parser ships on npm. Covers every field, the option entries
  Studio renders, validation, and importing compatibility into meta.
outline:
  - 2
  - 3
order: 14
navigation:
  title: Manifest
  icon: i-iconoir-page
---

# Extension manifest

`kubb-extension.json` sits at an extension package's root and ships on npm. The [registry](/docs/5.x/reference/registry), [`kubb add`](/docs/5.x/reference/commands/add), [`kubb init`](/docs/5.x/reference/commands/init), [`kubb list`](/docs/5.x/reference/commands/list), and the [Studio](/docs/5.x/reference/commands/studio#plugins-in-studio) agent read it. Generation does not: at runtime, Kubb reads the extension's [`meta`](/docs/5.x/reference/kit/extensions#meta).

Set `$schema` to [`https://kubb.dev/schemas/kubb-extension.json`](https://kubb.dev/schemas/kubb-extension.json) for validation and completion in your editor.

```json [kubb-extension.json]
{
  "$schema": "https://kubb.dev/schemas/kubb-extension.json",
  "kind": "plugin",
  "name": "plugin-example",
  "export": "pluginExample",
  "displayName": "Example",
  "description": "Writes a comment with the HTTP method and path of every operation.",
  "category": "documentation",
  "icon": { "light": "https://example.com/icon.svg" },
  "tags": ["comments", "operations"],
  "docs": "https://github.com/acme/kubb-plugin-example#readme",
  "maintainers": [{ "name": "Acme", "github": "acme" }],
  "compatibility": { "kubb": ">=5.8.3", "node": ">=22" },
  "options": [
    {
      "key": "prefix",
      "path": ["prefix"],
      "label": "Prefix",
      "description": "Text written at the start of every comment.",
      "type": "text"
    }
  ]
}
```

## Fields

Readers ignore unknown top-level keys. Every URL must use HTTPS.

::field-group

### `$schema`

:::field{type="string"}
The JSON Schema URL. Only editors read it.
:::

### `kind`

:::field{type="'plugin' | 'adapter' | 'parser'" required}
What the package extends. `kubb add` adds a `plugin` or `parser` to the config, and prints the code for an `adapter`. Studio builds a form for every kind and lets users switch plugins on and off.
:::

### `name`

:::field{type="string" required}
The extension's `meta.name`, such as `plugin-zod`, `oas`, or `typescript`. Kubb skips a manifest whose `name` is not shaped like an npm package name: lowercase letters, digits, `.`, `_`, `~`, and `-`, with an optional `@scope/`.
:::

### `export`

:::field{type="string" required}
The factory users call in `kubb.config.ts`, such as `pluginZod`. It must be a JavaScript identifier. `kubb add` imports it, and the Studio agent calls it.
:::

### `displayName`

:::field{type="string" required}
The human-readable name, such as `Zod`.
:::

### `description`

:::field{type="string" required}
One sentence on what the extension does.
:::

### `category`

:::field{type="string"}
A category for filtering, such as `validation`. The registry replaces it with the reviewer's pick from [the category list](/docs/5.x/reference/registry#categories).
:::

### `icon`

:::field{type="{ light: string; dark?: string }"}
Icon URLs for light and dark backgrounds. Studio shows a generic icon when the manifest has none.
:::

### `media`

:::field{type="Array<string>"}
Screenshots or videos.
:::

### `tags`

:::field{type="Array<string>"}
Search keywords.
:::

### `docs`

:::field{type="string"}
The documentation URL.
:::

### `maintainers`

:::field{type="Array<{ name: string; github?: string }>"}
The people who maintain the extension, shown on its kubb.dev page. Each entry needs a `name` and can add a `github` username.
:::

### `dependencies`

:::field{type="Array<string>"}
The extensions that must be in the same config, such as `["plugin-ts"]`. kubb.dev lists them, and `kubb init` checks that each one is chosen. At runtime, Kubb checks the plugin's own [`dependencies`](/docs/5.x/reference/kit/extensions#dependencies).
:::

### `optionalDependencies`

:::field{type="Array<string>"}
The extensions the plugin uses when present, or needs only for some option values, such as `["plugin-faker"]` for `@kubb/plugin-msw` with `parser: 'faker'`. They match the runtime `dependencies` marked `optional: true` or picked from the options. `kubb init` does not require them.
:::

### `compatibility`

:::field{type="{ kubb?: string; node?: string }"}
Semver ranges for Kubb (`@kubb/core`) and Node.js. Any other key makes the manifest invalid, so a typo such as `nodejs` cannot skip a check. `kubb add` and `kubb update` check the ranges before they install. Kubb checks them at runtime through `meta.compatibility`, so [import them from the manifest](#import-compatibility-into-meta).
:::

### `role`

:::field{type="'client' | 'consumer'"}
Plugins only. `client` ships the HTTP client runtime, like `@kubb/plugin-fetch`. `consumer` calls a client but ships none, like `@kubb/plugin-react-query`. Studio and `kubb init` require a client plugin next to a consumer.
:::

### `options`

:::field{type="Array<ExtensionManifestOption>"}
The form fields Kubb Studio shows for the extension. See [Option entries](#option-entries).
:::

::

## Option entries {#option-entries}

Each `options` entry is one form field that edits the value at `path` in the factory's options.

| Field         | Type                                                    | Required          | Description                                                                                         |
| ------------- | ------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `key`         | `string`                                                | Yes               | A stable UI key, unique within the manifest, such as `enumType`.                                    |
| `path`        | `Array<string>`                                         | Yes               | Where the value lives, such as `["enum", "type"]`. No segment may be `__proto__`, `constructor`, or `prototype`. |
| `label`       | `string`                                                | Yes               | The field label.                                                                                    |
| `type`        | `'select' \| 'boolean' \| 'text' \| 'number' \| 'list'` | Yes               | The field type.                                                                                     |
| `description` | `string`                                                | No                | Help text under the field.                                                                          |
| `default`     | any JSON value                                          | No                | The plugin's runtime default, shown when unset. Studio does not write a value equal to it.          |
| `choices`     | `Array<{ label?: string; value: JSONValue }>`           | For `select`      | The choices, at least one. A `value` of `null` leaves the option unset. A `default` must equal one of them. |
| `trueValue`   | any JSON value                                          | No, for `boolean` | The value written for `true`. Defaults to `true`.                                                   |
| `falseValue`  | any JSON value                                          | No, for `boolean` | The value written for `false`. Defaults to `false`.                                                 |
| `item`        | any JSON value                                          | No, for `list`    | A template for each entry, where every `"$item"` string becomes the entry. Without it, entries are plain strings. |
| `itemCase`    | `'upper'`                                               | No, for `list`    | Uppercases each entry before writing it.                                                            |

## Validation

Kubb and the registry check a manifest at different points:

| Reader                                                                | Checks                                                                                                                                                           | On failure                                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `kubb add`, `kubb init`, `kubb update`, `kubb list`, the Studio agent | The required fields and their shape, each `maintainers` and `options` entry, extension names in `dependencies` and `optionalDependencies`, `role`, `compatibility`, unique option keys, and `select` choices and defaults. | The manifest is skipped.                                                                |
| The registry                                                          | The JSON Schema, unique option keys, `choices` on every `select`, and a `select` default that equals one of its choices.                                          | The review pull request lists the problem, and the weekly bump keeps the previous pin.  |

In your own code, `isExtensionManifest(value)` from `kubb/kit` runs the same checks as Kubb. `manifestProblems(manifest)` lists the option problems of a well-formed manifest.

## Import `compatibility` into `meta` {#import-compatibility-into-meta}

Import only `compatibility` from the manifest into `meta`, so the ranges live in one file and a bundler leaves the rest, including `options`, out of your build:

```typescript [src/plugin.ts]
import { defineExtension } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'

export const pluginExampleName = 'plugin-example'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: pluginExampleName, version, compatibility },
  setup(options) {
    return options
  },
})
```

Keep `name` as a typed constant, because a JSON import widens it to `string`. Named JSON imports need a bundler that inlines them, such as tsdown. With plain `tsc` and `"module": "NodeNext"`, write the ranges in `meta.compatibility` instead.
