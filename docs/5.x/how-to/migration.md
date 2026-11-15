---
layout: doc
title: Migrate Kubb v4 to v5 - Config and plugin changes
description: Upgrade a Kubb v4 project to v5 with before and after tables for
  the config, the OpenAPI adapter, shared options, and each official plugin.
outline:
  - 2
  - 3
order: 5
navigation:
  title: Upgrade to v5
  icon: i-iconoir-transition-up
---

# Upgrade from v4 to v5

Update the packages, migrate the config, regenerate, then fix the imports and call sites in your app.

## Before you start {#before-you-start}

Use Node.js 22.22 or later in development, CI, and Docker. Update `kubb` and your plugins to v5. Plugin package names stay the same.

| v4 package | v5 |
| --- | --- |
| `@kubb/plugin-oas` | Remove it. `kubb` includes the [OpenAPI adapter](#adapter-oas). To pass adapter options, as the v5 config below does, install `@kubb/adapter-oas` and import `adapterOas`. |
| `@kubb/plugin-client` with `client: 'axios'` or `'fetch'` | [`@kubb/plugin-axios` or `@kubb/plugin-fetch`](#plugin-client). |
| `@kubb/plugin-client` with your own client module | Keep `@kubb/plugin-client`. |
| `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query` | Remove them. There is no replacement. |

## Defaults that changed {#defaults-that-changed}

| Behavior | v4 | v5 | Keep v4 behavior with |
| --- | --- | --- | --- |
| `output.format` | `'prettier'` | `false` | `format: 'prettier'` |
| `output.lint` | `'auto'` | `false` | `lint: 'auto'` |
| Root barrel | `'named'` | `false` | `output.barrel: { type: 'named' }` |
| Tag folder | `<tag>Controller` | `<tag>` | [`group.name`](#output-layout) |
| React and Vue Query hooks | Generated | `hooks: false` | `hooks: true` |
| Client errors | Returned | Thrown, `throwOnErrorDefault: true` | `throwOnErrorDefault: false` |
| OpenAPI `int64` | `number` | `bigint` | `integerType: 'number'` on the adapter |
| SWR mutation arguments | Trigger shape opt-in | Always passed through `trigger()` | No option |

## Migrate the config {#migrate-the-config}

::code-group

```typescript [v4]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen', barrelType: 'named' },
  hooks: { done: ['npm run typecheck'] },
  plugins: [pluginOas({ serverIndex: 0 }), pluginTs({ enumType: 'asConst' }), pluginClient({ client: 'axios' })],
})
```

```typescript [v5]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' }, postGenerate: ['npm run typecheck'] },
  adapter: adapterOas({ server: { index: 0 } }),
  plugins: [pluginTs({ enum: { type: 'asConst' } }), pluginAxios()],
})
```

::

| v4 | v5 |
| --- | --- |
| `defineConfig` from `@kubb/core` | `defineConfig` from `kubb/config`. |
| `input: { path }` or `input: { data }` | `input` as the path, URL, spec string, or parsed object itself. The wrapper fails with `KUBB_LEGACY_INPUT`. |
| `output.storage` | Top-level `storage`, with helpers from `kubb/kit`. |
| `hooks.done` | `output.postGenerate`, an array of strings or `{ name, command }` objects. |
| `KUBB_HOOK_FAILED` | `KUBB_POST_GENERATE_FAILED`. |
| `output.override` | Removed. Use a storage driver to control writes. |
| `kubb:debug` hooks, `createDebugger` | Removed. |
| `--debug` | `--reporter file`. |
| `--log-level debug` | `--log-level verbose`, or a [reporter](/docs/5.x/reference/configuration#reporters). |

### OpenAPI adapter {#adapter-oas}

Remove `pluginOas()`. `defineConfig` adds `adapterOas()`, the TypeScript, TSX, and Markdown parsers, and the barrel plugin. Set `adapter` only to pass options.

| v4 | v5 on `adapterOas` |
| --- | --- |
| `dateType`, `integerType`, `unknownType`, `emptySchemaType`, `enumSuffix`, `contentType` on plugins | The same names, set once for the whole config. |
| `serverIndex`, `serverVariables` | `server: { index, variables }`. |
| `discriminator: 'strict'` | `discriminator: 'preserve'`, the default. |
| `discriminator: 'inherit'` | `discriminator: 'propagate'`. |
| `validate` | Unchanged, `true` by default. |

### Output layout {#output-layout}

| v4 `output.barrelType` | v5 `output.barrel` |
| --- | --- |
| `'named'` | `{ type: 'named' }` |
| `'all'` | `{ type: 'all' }` |
| `'propagate'` (plugin only) | `{ type: 'named', nested: true }` |
| `false` | `false` |

- Plugins still write a named barrel by default. An `output` you pass replaces that default, so repeat [`barrel`](/docs/5.x/how-to/recipes#barrel-files) in it.
- `output.mode` follows `output.path`: an extension means one file, otherwise a directory. `group` with file mode fails with `KUBB_INVALID_PLUGIN_OPTIONS`.
- Tag folders drop the `Controller` suffix, or `Requests` for Cypress and MCP. To keep it, set ``group: { type: 'tag', name: ({ group }) => `${group}Controller` }``.

## Shared plugin options {#shared-plugin-options}

| v4 | v5 |
| --- | --- |
| `transformers.name` | `resolver.name`. Call the exported resolver to keep the default casing. |
| `transformers.schema` | `macros`. |
| `mapper` | A schema macro or a `printer.nodes` override. |
| `generators` | A custom plugin. |
| `paramsType`, `pathParamsType`, `paramsCasing` | One grouped `{ body, path, query, headers }` object with the spec's names. For camelCase path params, set [`pathParamsCasing: 'camelcase'`](/extensions/kubb-labs/adapter-oas/options#pathparamscasing) on the adapter. |

A group with a required parameter is required, and an unused group is typed `never`. Update positional call sites:

::code-group

```typescript [v4]
useGetPet(petId)
useFindPets({ status: 'available' })
useUpdatePet().mutate({ petId, data: pet })
```

```typescript [v5]
useGetPet({ path: { petId } })
useFindPets({ query: { status: 'available' } })
useUpdatePet().mutate({ path: { petId }, body: pet })
```

::

A resolver can receive names in a different casing than a v4 name transformer, so check the identifiers after you move one. See [Customize generated code](/docs/5.x/how-to/customize).

## HTTP clients {#plugin-client}

| v4 | v5 |
| --- | --- |
| `pluginClient({ client: 'axios' })` | `pluginAxios()` |
| `pluginClient({ client: 'fetch' })` | `pluginFetch()` |
| `clientType`, `wrapper` | `sdk`: `mode: 'tag'` (default) writes a class per tag, `name` adds a root class, `mode: 'flat'` writes one class. Leave it unset for the standalone functions that query plugins use. |
| `dataReturnType` | `returnType`, default `'full'` |
| `parser: 'zod'` | `validator: 'zod'` |
| `parser: 'client'` | `validator: false`, the default. |
| `operations`, `clientType: 'staticClass'`, `bundle`, `urlType` | Removed. The Axios and Fetch plugins write their client to `.kubb/client.ts`. URL-only helpers need a custom plugin. |
| `importPath` to your own client module | `pluginClient({ importPath })`, without `sdk` or `baseURL`, because your module owns the client. |

- `returnType: 'full'` returns `{ status, data, error, contentType, headers, request, response }`. Read `data`, call `.unwrap()`, or set `returnType: 'data'` for the body alone.
- Pass `throwOnError: false` on a call to inspect an error without throwing.

::code-group

```typescript [v4]
const pet = await getPet(1)
```

```typescript [v5]
const { data: pet } = await getPet({ path: { petId: 1 } })
```

::

## TypeScript {#plugin-ts}

| v4 | v5 |
| --- | --- |
| `enumType` | `enum.type` |
| `enumTypeSuffix` | `enum.typeSuffix` |
| `enumKeyCasing` | `enum.keyCasing` |
| `enumType: 'asPascalConst'` | `enum: { type: 'asConst', constCasing: 'pascalCase' }` |

Generated types change too:

- Request inputs are `*Options` types with `body`, `path`, `query`, and `headers`, and keep OpenAPI names such as `pet_id` and `X-Api-Key`.
- Enums default to a const-asserted object plus a `*Key` type union. Inline enum names are scoped to their operation.

See [TypeScript options](/extensions/kubb-labs/plugin-ts/options).

## Zod {#plugin-zod}

Upgrade `zod` to v4.

| v4 | v5 |
| --- | --- |
| `version` | Removed. v5 prints Zod 4. |
| `typed: true` | Removed. Set `inferred: true` to export `z.infer` type aliases. |
| Inferred alias `PetSchema` | `PetSchemaType` |
| `wrapOutput` | A `printer.nodes` override. `this.base(node)` returns the default expression to decorate. |
| `operations` | Removed. Its operation and path maps need a custom plugin. |
| `listPets200Schema` | `listPetsStatus200Schema` |

See [Zod options](/extensions/kubb-labs/plugin-zod/options).

## React Query {#plugin-react-query}

- Register a client plugin: Axios, Fetch, or `@kubb/plugin-client`.
- Move `baseURL` and validation to the client plugin, and remove `parser`.
- Set `hooks: true` to keep the `use*` hooks.
- Queries and mutations take grouped `*Options`.
- `TData` holds only 2xx responses, and errors use `TError`.
- The generated `enabled` guard is gone. Set TanStack Query's `enabled` or `skipToken` to defer a request.

See [React Query options](/extensions/kubb-labs/plugin-react-query/options).

## Vue Query {#plugin-vue-query}

Apply the [React Query](#plugin-react-query) changes. Set `hooks: true` to keep the composables. See [Vue Query options](/extensions/kubb-labs/plugin-vue-query/options).

## SWR {#plugin-swr}

Apply the client, parameter, and validation changes from [React Query](#plugin-react-query). Remove `mutation.paramsToTrigger`, because mutation parameters always pass through `trigger()`:

```typescript [src/app.ts]
useUpdatePet().trigger({ path: { petId }, body: pet })
```

SWR keys requests off `shouldFetch` instead of a parameter-presence guard. Set it to `false` to skip a request. See [SWR options](/extensions/kubb-labs/plugin-swr/options).

## Faker {#plugin-faker}

Remove `paramsCasing` and `mapper`, and use macros or printers instead. See [Faker options](/extensions/kubb-labs/plugin-faker/options).

## MSW {#plugin-msw}

`parser`, `handlers`, and `baseURL` keep their v4 behavior. Apply the [shared option](#shared-plugin-options) and [adapter `contentType`](#adapter-oas) changes. See [MSW options](/extensions/kubb-labs/plugin-msw/options).

## Cypress {#plugin-cypress}

- Request helpers take grouped `*Options`, then the unchanged `Partial<Cypress.RequestOptions>`.
- Remove `dataReturnType`. Helpers yield the body as `Cypress.Chainable<T>`.
- Imports use `*Options` and `*Response` names.

See [Cypress options](/extensions/kubb-labs/plugin-cypress/options).

## MCP {#plugin-mcp}

- Register TypeScript, Zod, and an Axios or Fetch client. `client` selects the registered client.
- Move `baseURL` to that client and remove `paramsCasing`.

See [MCP options](/extensions/kubb-labs/plugin-mcp/options).

## Verify the upgrade {#verify-the-upgrade}

Run `kubb generate`, review the changed files, and type-check your app. Most errors come from these renames:

- Response imports now use `Status<code>` names.
- Zod inferred types end in `SchemaType`.
- Tag folders lost their `Controller` suffix.

See [Rare v4 upgrade cases](EDGE:v4-upgrade-edge-cases) for less common changes.
