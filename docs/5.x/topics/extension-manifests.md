---
layout: doc
title: Extension manifests - Validation and dependencies
description: What Kubb and the registry check in kubb-extension.json, what reads each field, and how compatibility ranges, array dependencies, and docs limits work.
outline:
  - 2
  - 3
order: 10
navigation:
  title: Extension manifests
  icon: i-iconoir-journal
---

# Extension manifests

Extension authors need these rules when Kubb skips a manifest, the registry review fails, or a `meta` check behaves unexpectedly.

## Manifest validation {#manifest-validation}

When Kubb skips your manifest or the registry review fails, check what each reader checks. Source: [Validation](/docs/5.x/reference/kit/manifest#validation).

| Reader | Checks | On failure |
| --- | --- | --- |
| `kubb add`, `kubb init`, `kubb update`, `kubb list`, the Studio agent | The required fields and their shape, each `maintainers` and `options` entry, extension names in `dependencies` and `optionalDependencies`, `role`, `compatibility`, unique option keys, and `select` choices and defaults. | The manifest is skipped. |
| The registry | The JSON Schema, unique option keys, `choices` on every `select`, and a `select` default that equals one of its choices. | The review pull request lists the problem, and the weekly bump keeps the previous pin. |

In your own code, `isExtensionManifest(value)` from `kubb/kit` runs the same checks as Kubb. `manifestProblems(manifest)` lists the option problems of a well-formed manifest.

| Field | Rule |
| --- | --- |
| [`name`](/docs/5.x/reference/kit/manifest#name) | Kubb skips a manifest whose `name` is not shaped like an npm package name: lowercase letters, digits, `.`, `_`, `~`, and `-`, with an optional `@scope/`. |
| [`compatibility`](/docs/5.x/reference/kit/manifest#compatibility) | Any key other than `kubb` or `node` makes the manifest invalid, so a typo such as `nodejs` cannot skip a check. |
| Option [`default`](/docs/5.x/reference/kit/manifest#option-entries) | Studio does not write a value equal to it. |

## Manifest readers {#manifest-readers}

When you fill in a manifest field, this is what reads it. Source: [Fields](/docs/5.x/reference/kit/manifest#fields).

| Field | Who reads it |
| --- | --- |
| `kind` | Studio builds a form for every kind and lets users switch plugins on and off. |
| `export` | `kubb add` imports it, and the Studio agent calls it. |
| `icon` | Studio shows a generic icon when the manifest has none. |
| `maintainers` | Each entry needs a `name` and can add a `github` username. |
| `dependencies` | kubb.dev lists them. |
| `optionalDependencies` | They match the runtime `dependencies` marked `optional: true` or picked from the options, such as `["plugin-faker"]` for `@kubb/plugin-msw` with `parser: 'faker'`. |

## Compatibility ranges {#compatibility-ranges}

When a run fails with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension), an extension's `meta.compatibility` does not match the running `@kubb/core` or Node.js. Source: [Compatibility checks](/docs/5.x/reference/kit/extensions#compatibility-checks).

- Before any plugin runs, Kubb checks the `meta.compatibility` of the adapter, every parser, and every plugin.
- `kubb add` checks it before it installs.
- Prereleases compare like releases.
- A canary build (`0.0.0-canary-*`) skips the `kubb` range.

## Array dependencies {#array-dependencies}

When a plugin declares [`dependencies`](/docs/5.x/reference/kit/extensions#dependencies) as an array, such as `dependencies: ['plugin-ts']`, the array still works but only orders plugins. Sources: [Dependencies](/docs/5.x/explanation/architecture#dependencies), [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency), and [`KUBB_INCOMPATIBLE_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-incompatible-dependency).

| Form | A missing plugin | Versions |
| --- | --- | --- |
| An array of plugin names | Skipped. It never raises `KUBB_MISSING_DEPENDENCY`. | Not checked |
| A record keyed by plugin name | A missing required plugin fails the run before any plugin runs. | Out of range fails the run before any plugin runs. A dependency without `meta.version` is not checked. |

Both forms set the order. Use the record form to fail early when a required plugin is missing or out of range.

## Hand-written extensions {#hand-written-extensions}

When you write a plugin or parser object by hand instead of calling a factory, Kubb fills in `meta` only from the deprecated `name`. Source: [Factory statics](/docs/5.x/reference/kit/extensions#factory-statics).

- An object with only the deprecated `name` gets `meta: { name }`.
- An object with neither `name` nor `meta` fails with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options).

## Extension docs limits {#extension-docs-limits}

When the registry reads your package's `docs/` folder, it applies these limits. Source: [Extension docs](/docs/5.x/reference/kit/extension-docs).

- The registry ignores files other than `overview.md`, `options.md`, and `guides/<id>.md`. It skips a file larger than 256 KiB and reports it.
- Guides are sorted by file name, at most 50. A version that ships more lists the first 50.
- For a guide, kubb.dev shows the description on the guide's card, in the guide filter, and as the meta description.
