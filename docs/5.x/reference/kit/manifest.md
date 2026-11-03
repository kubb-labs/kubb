---
layout: doc
title: Extension manifest
description: Reference for kubb-extension.json, the manifest a Kubb plugin,
  adapter, or parser ships on npm. Covers every top-level field, the
  compatibility rule, validation, and importing compatibility into meta.
outline:
  - 2
  - 3
order: 14
navigation:
  title: Manifest
  icon: i-iconoir-page
---

# Extension manifest

`kubb-extension.json` describes an extension package. It sits at the package root and ships on npm. The [Kubb registry](/docs/5.x/reference/registry), [`kubb add`](/docs/5.x/reference/commands/add), [`kubb init`](/docs/5.x/reference/commands/init), [`kubb list`](/docs/5.x/reference/commands/list), and the [Studio](/docs/5.x/reference/commands/studio#plugins-in-studio) agent read it. Generation does not: at runtime Kubb reads the extension's [`meta`](./extensions#meta).

The JSON Schema is [`https://kubb.dev/schemas/kubb-extension.json`](https://kubb.dev/schemas/kubb-extension.json). Set it as `$schema` to get validation and completion in your editor.

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

Readers ignore unknown top-level keys.

::field-group

### `$schema`

:::field{type="string"}
The JSON Schema URL, `https://kubb.dev/schemas/kubb-extension.json`. Only editors read it.
:::

### `kind`

:::field{type="'plugin' | 'adapter' | 'parser'" required}
What the package extends. `kubb add` adds a `plugin` or `parser` to the config and prints the code for an `adapter`. Studio builds a form for every kind: plugins can be switched on and off, while the adapter and the parsers are the ones the config registers.
:::

### `name`

:::field{type="string" required}
The extension's `meta.name`, such as `plugin-zod`, `oas`, or `typescript`. Kubb skips a manifest whose `name` is not shaped like an npm package name: lowercase letters, digits, `.`, `_`, `~`, and `-`, with an optional `@scope/`.
:::

### `export`

:::field{type="string" required}
The factory export users call in `kubb.config.ts`, such as `pluginZod`. It must be a JavaScript identifier. `kubb add` imports this name, and the Studio agent calls it.
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
Category for filtering, such as `validation`. The registry replaces it with the main category the reviewer picks from [the category list](/docs/5.x/reference/registry#categories).
:::

### `icon`

:::field{type="{ light: string; dark?: string }"}
Icon URLs for light and dark backgrounds. Both must use HTTPS. Studio shows a generic icon when the manifest has none.
:::

### `media`

:::field{type="Array<string>"}
Screenshots or videos, as HTTPS URLs.
:::

### `tags`

:::field{type="Array<string>"}
Search keywords.
:::

### `docs`

:::field{type="string"}
Documentation URL, using HTTPS.
:::

### `maintainers`

:::field{type="Array<{ name: string; github?: string }>"}
The people who maintain the extension, shown on its kubb.dev page. Each entry needs a `name`, such as `Stijn Van Hulle`, and can add a `github` username, such as `stijnvanhulle`.
:::

### `dependencies`

:::field{type="Array<string>"}
Names of the extensions that must be in the same config, such as `["plugin-ts"]`. kubb.dev lists them on the extension's page, and `kubb init` checks that each one is chosen. Generation does not read them: at runtime Kubb uses the plugin's own [`dependencies`](./extensions#dependencies).
:::

### `optionalDependencies`

:::field{type="Array<string>"}
Names of the extensions the plugin uses when they are in the same config, or needs only for some option values. `@kubb/plugin-msw` lists `["plugin-faker"]`, because it needs `@kubb/plugin-faker` only with `parser: 'faker'`. They match the entries marked `optional: true` or picked from the options in the plugin's runtime [`dependencies`](./extensions#dependencies). kubb.dev lists them below the dependencies. `kubb init` does not require them.
:::

### `compatibility`

:::field{type="{ kubb?: string; node?: string }"}
Semver ranges for Kubb (`@kubb/core`) and Node.js, such as `{ "kubb": ">=5.8.3", "node": ">=22" }`. Only these two keys are allowed. Any other key makes the manifest invalid, so a typo such as `nodejs` cannot skip a check.

`kubb add` and `kubb update` check the ranges before they install. Kubb checks the same ranges at runtime through `meta.compatibility`, so [import it from the manifest](#import-compatibility-into-meta).
:::

### `role`

:::field{type="'client' | 'consumer'"}
Plugins only. `client` provides the HTTP client runtime, like `@kubb/plugin-fetch`. `consumer` generates code that calls a client but ships none, like `@kubb/plugin-react-query`. Studio and `kubb init` use it to require a client plugin next to a consumer.
:::

### `options`

:::field{type="Array<ExtensionManifestOption>"}
Form fields Kubb Studio shows for the extension. The [JSON Schema](https://kubb.dev/schemas/kubb-extension.json) describes each field.
:::

::

## Validation

Kubb and the registry check a manifest at different points:

| Reader | Checks | On failure |
| --- | --- | --- |
| `kubb add`, `kubb init`, `kubb update`, `kubb list`, the Studio agent | The required fields are set and well formed. Each `maintainers` entry has a `name`. Each `dependencies` and `optionalDependencies` entry is an extension name. `role` is `client` or `consumer`. `compatibility` holds only `kubb` and `node` string ranges. `options` is an array. | The manifest is skipped. |
| The registry | The JSON Schema, unique option keys, `choices` on every `select`, and a `select` default that equals one of its choices. | The review pull request lists the problem, and the weekly bump keeps the previous pin. |

## Import `compatibility` into `meta` {#import-compatibility-into-meta}

Keep the ranges in one place. Import only `compatibility` from the manifest into `meta`, so a bundler leaves the rest of the file, including `options`, out of your build:

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

Keep `name` as a typed constant. A JSON import widens it to `string`. Named imports from JSON need a bundler, such as tsdown, that inlines them. With plain `tsc` and `"module": "NodeNext"`, write the same ranges in `meta.compatibility` instead.
