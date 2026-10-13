---
layout: doc
title: Extension registry
description: Reference for the Kubb extension registry protocol at
  kubb.dev/registry, its index and detail documents, registry ids, records that
  pin one npm version or GitHub release, and how to host your own registry.
outline:
  - 2
  - 3
order: 10
navigation:
  title: Extension registry
  icon: i-iconoir-database
---

# Extension registry

The Kubb extension registry lists reviewed plugins, adapters, and parsers. Each entry pins one npm version or one GitHub release. [`kubb add`](/docs/5.x/reference/commands/add), [`kubb update`](/docs/5.x/reference/commands/update), [`kubb list`](/docs/5.x/reference/commands/list), kubb.dev, and Kubb Studio read it.

The base URL is `https://kubb.dev/registry`. The registry is a set of plain static JSON documents:

- Served as `application/json`, with CORS allowed, so any site or tool can read them.
- Answered directly, never through a redirect.
- Cached for 10 minutes (`cache-control: public, max-age=600`).

[kubb-labs/registry](https://github.com/kubb-labs/registry) builds the documents on every merge and once a day.

## Registry ids

An id is `<owner>/<slug>`, such as `kubb-labs/plugin-zod`:

- `<owner>` is the GitHub owner of the source repository, in lowercase.
- `<slug>` is the package name without its scope. `@kubb/plugin-zod` gives `plugin-zod`.
- Both parts match `[a-z0-9]+(?:-[a-z0-9]+)*`: lowercase letters and digits joined by single hyphens.

The CLI accepts a bare `<slug>` and reads it as `kubb-labs/<slug>`. An entry owned by `kubb-labs` has `type: "official"`. Every other entry is `community`.

## `GET <base>/index.json` {#index}

Returns every extension in the registry:

```typescript
type RegistryIndex = {
  version: 1
  generatedAt: string
  extensions: Array<RegistryEntry>
}
```

The CLI rejects an index whose `version` is not `1`. It skips an entry that fails validation and keeps the rest.

## `GET <base>/<owner>/<slug>.json` {#detail}

Returns one extension and the docs its pinned version ships:

```typescript
type RegistryDetail = RegistryEntry & {
  overview: string | null
  options?: string | null
  guides?: Array<RegistryGuide>
}

type RegistryGuide = {
  id: string
  title: string
  description: string
  content: string
}
```

The fields come from the package's [`docs/` folder](/docs/5.x/reference/kit/extension-docs):

- `overview` is the Markdown of `docs/overview.md`, or the overview the reviewer wrote.
- `options` is the Markdown of `docs/options.md`, or `null` when the package ships none.
- `guides` holds one entry per `docs/guides/<id>.md`, in file name order. `id` is the file name without `.md`, `title` is the first `#` heading, `description` is the first paragraph after it, and `content` is the whole file.

Read a missing `options` as `null` and a missing `guides` as `[]`. An unknown id answers 404, and `kubb add` reports `"<id>" is not in the registry at <registry>.`

## `RegistryEntry` {#registry-entry}

`@kubb/core` exports the `RegistryEntry`, `RegistryIndex`, `RegistryDetail`, and `RegistryGuide` types.

::field-group

### `id`

:::field{type="string" required}
The registry id, such as `kubb-labs/plugin-zod`.
:::

### `kind`

:::field{type="'plugin' | 'adapter' | 'parser'" required}
The extension kind. It always equals `manifest.kind`.
:::

### `type`

:::field{type="'official' | 'community'" required}
`official` when the owner is `kubb-labs`, otherwise `community`.
:::

### `artifact`

:::field{type="RegistryArtifact" required}
The install pin the registry approved. It has one of two kinds:

- `{ kind: 'npm', package, version }`: `kubb add` and `kubb update` install `<package>@<version>`.
- `{ kind: 'github', package, version, owner, repo, tag, commit }`: a release of a package at the repository root. `kubb add` and `kubb update` install `github:<owner>/<repo>#<commit>`. `package` is the `name` in its `package.json`, and `tag` names `version`.
:::

### `repository`

:::field{type="{ url: string }"}
The source on GitHub. An npm artifact may point at the package folder. A GitHub artifact uses the repository root.
:::

### `manifest`

:::field{type="ExtensionManifest" required}
The [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) of the pinned version, with the reviewer's main category and listing overrides applied. An official version released before manifests ships none. The index leaves out that extension until a version that ships a manifest is pinned.
:::

### `stats`

:::field{type="{ downloads?: number; weekly?: number; stars?: number }"}
Download and star counts, when known.
:::

### `submittedAt`

:::field{type="string" required}
When the extension was submitted. It never changes.
:::

### `publishedAt`

:::field{type="string" required}
When the first version was approved and listed. It never changes.
:::

### `reviewedAt`

:::field{type="string" required}
When the pinned version was approved. Every version bump moves it.
:::

::

Timestamps are UTC, to the second, such as `2026-10-12T20:00:00Z`.

The CLI skips an entry unless `id` is a full `<owner>/<slug>`, `artifact` is an npm or GitHub pin with an exact semver version, and `manifest` is valid with the entry's `kind`. A detail document's `id` must equal the id the CLI asked for.

## Records

The reviewed records live in [kubb-labs/registry](https://github.com/kubb-labs/registry) at `extensions/<owner>/<slug>.json`. The registry's build turns them into the documents above. Merging a record approves its pinned version.

```json [extensions/kubb-labs/plugin-zod.json]
{
  "$schema": "https://kubb.dev/schemas/registry-record.json",
  "id": "kubb-labs/plugin-zod",
  "artifact": { "kind": "npm", "package": "@kubb/plugin-zod", "version": "5.4.4" },
  "repository": { "url": "https://github.com/kubb-labs/plugins/tree/main/packages/plugin-zod" },
  "submittedAt": "2026-10-12T20:11:53Z",
  "submittedBy": "stijnvanhulle",
  "publishedAt": "2026-10-12T20:11:53Z",
  "reviewedAt": "2026-10-12T20:11:53Z",
  "categories": ["validation"]
}
```

| Field | Written by | Meaning |
| --- | --- | --- |
| `id`, `artifact`, `repository`, `submittedAt`, `publishedAt`, `reviewedAt` | Bot | As in [`RegistryEntry`](#registry-entry). `id` must equal the file path. |
| `submittedBy` | Bot | The GitHub user who opened the submission. |
| `categories` | Reviewer | Category slugs. The first is the main one and replaces the manifest's `category`. |
| `listing` | Reviewer | Optional overrides for `displayName`, `description`, `tags`, and `icon`. |

The record JSON Schema is [`https://kubb.dev/schemas/registry-record.json`](https://kubb.dev/schemas/registry-record.json). To add a record, follow [Submit to the registry](/docs/5.x/how-to/submit-to-the-registry).

### Categories

| Slug | Use for |
| --- | --- |
| `types` | Generate TypeScript types and interfaces. |
| `validation` | Validate data at runtime with schemas. |
| `client` | Generate HTTP clients that call the API. |
| `framework` | Generate hooks and composables for UI frameworks. |
| `mocks` | Generate mock data and mock servers. |
| `testing` | Generate tests and test helpers. |
| `documentation` | Generate API documentation. |
| `ai` | Expose the API to AI agents and tools. |
| `output` | Shape the generated files, such as barrel files. |
| `openapi` | Read OpenAPI and Swagger specs. |
| `typescript` | Print generated code as TypeScript. |
| `docs` | Print generated code as Markdown. |

## Host your own registry

Serve the same two documents from any static host, then point the CLI at it with `KUBB_REGISTRY`. To build them from your own records, fork [kubb-labs/registry](https://github.com/kubb-labs/registry), replace `extensions/`, and run `pnpm build`. The `dist/` folder is the whole registry.

```shell [Terminal]
KUBB_REGISTRY=https://registry.example.com kubb add acme/plugin-graphql
```

With that base URL, the CLI reads `https://registry.example.com/index.json` and `https://registry.example.com/acme/plugin-graphql.json`. `KUBB_REGISTRY` must start with `http://` or `https://`, and trailing slashes are removed.

Your documents must follow the shapes on this page, and `index.json` must set `version: 1`. Answer 404 for an unknown id. Studio always reads the kubb.dev index, so a private registry changes what the CLI installs, not what Studio lists.

## See also

- [Extension manifest](/docs/5.x/reference/kit/manifest): the `manifest` field in every entry
- [Publish a plugin](/docs/5.x/how-to/publish-a-plugin): submit an extension for review
- [`kubb add`](/docs/5.x/reference/commands/add): install from the registry
