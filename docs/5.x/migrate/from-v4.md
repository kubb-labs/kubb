---
layout: doc
title: Migrate Kubb v4 to v5 - Config and plugin changes
description: Upgrade a Kubb v4 project to v5 with before and after tables for
  the config, the OpenAPI adapter, shared options, and each official plugin.
outline:
  - 2
  - 3
order: 4
navigation:
  title: Upgrade to v5
  icon: i-iconoir-transition-up
---

# Upgrade from v4 to v5

Update the packages and the config, run Kubb, then fix the imports and call sites in your app.

## Before you start {#before-you-start}

Use Node.js 22.22 or later, also in CI and Docker. Update `kubb` and your plugins to v5. Package names stay the same, except these:

| v4 package | v5 |
| --- | --- |
| `@kubb/plugin-oas` | Remove it. `kubb` includes the [OpenAPI adapter](#adapter-oas). |
| `@kubb/plugin-client` with `client: 'axios'` or `'fetch'` | [`@kubb/plugin-axios` or `@kubb/plugin-fetch`](#plugin-client). |
| `@kubb/plugin-client` with your own client module | Keep it. |
| `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query` | Remove them, with no replacement. |

## Defaults that changed {#defaults-that-changed}

| Behavior | v4 | v5 | Keep v4 behavior with |
| --- | --- | --- | --- |
| `output.format` | `'prettier'` | `false` | `format: 'prettier'` |
| `output.lint` | `'auto'` | `false` | `lint: 'auto'` |
| Root barrel | `'named'` | `false` | `output.barrel: { type: 'named' }` |
| Tag folder | `<tag>Controller` | `<tag>` | [`group.name`](#output-layout) |
| React and Vue Query hooks | Generated | `hooks: false`, which still writes query keys and option factories | `hooks: true` |
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
| `defineConfig` from `@kubb/core` | From `kubb/config`. |
| `input: { path }` or `input: { data }` | The path, URL, spec string, or parsed object itself. The wrapper fails with `KUBB_LEGACY_INPUT`. |
| `output.storage` | Top-level `storage`, with helpers from `kubb/kit`. |
| `hooks.done` | `output.postGenerate`: strings or `{ name, command }` objects. |
| `KUBB_HOOK_FAILED` | `KUBB_POST_GENERATE_FAILED`. |
| `output.override` | Removed. Use a storage driver to control writes. |
| `kubb:debug` hooks, `createDebugger` | Removed. |
| `--debug` | `--reporter file`. |
| `--log-level debug` | `--log-level verbose`, or a [reporter](/docs/5.x/reference/configuration#reporters). |

### OpenAPI adapter {#adapter-oas}

`defineConfig` adds `adapterOas()`, the TypeScript, TSX, and Markdown parsers, and the barrel plugin. To pass adapter options, install `@kubb/adapter-oas` and set `adapter`.

| v4 | v5 on `adapterOas` |
| --- | --- |
| `dateType`, `integerType`, `unknownType`, `emptySchemaType`, `enumSuffix`, `contentType` on plugins | The same names, set once. |
| `serverIndex`, `serverVariables` | `server: { index, variables }`. |
| `discriminator: 'strict'` | `'preserve'`, the default. |
| `discriminator: 'inherit'` | `'propagate'`. |
| `validate` | Unchanged, `true` by default. |

### Output layout {#output-layout}

| v4 `output.barrelType` | v5 `output.barrel` |
| --- | --- |
| `'named'` | `{ type: 'named' }` |
| `'all'` | `{ type: 'all' }` |
| `'propagate'` (plugin only) | `{ type: 'named', nested: true }` |
| `false` | `false` |

- An `output` you pass to a plugin replaces its default named barrel, so repeat `barrel` in it.
- `output.mode` follows `output.path`: a file extension means one file, otherwise a directory. `group` with file mode fails with `KUBB_INVALID_PLUGIN_OPTIONS`.
- Tag folders drop the `Controller` suffix, or `Requests` for Cypress and MCP. To keep it, set ``group: { type: 'tag', name: ({ group }) => `${group}Controller` }``.

## Shared plugin options {#shared-plugin-options}

| v4 | v5 |
| --- | --- |
| `transformers.name` | [`resolver.name`](/docs/5.x/how-to/customize). Its input casing can differ from v4. Check the names, or call the exported resolver for the default casing. |
| `transformers.schema` | `macros`. |
| `mapper` | A schema macro or a `printer.nodes` override. |
| `generators` | A custom plugin. |
| `paramsType`, `pathParamsType`, `paramsCasing` | One `{ body, path, query, headers }` object with the spec's names. For camelCase path params, set [`pathParamsCasing: 'camelcase'`](/extensions/kubb-labs/adapter-oas/options#pathparamscasing) on the adapter. |

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

## HTTP clients {#plugin-client}

| v4 | v5 |
| --- | --- |
| `pluginClient({ client: 'axios' })` | `pluginAxios()` |
| `pluginClient({ client: 'fetch' })` | `pluginFetch()` |
| `clientType`, `wrapper` | [`sdk`](/extensions/kubb-labs/plugin-axios/options#sdk), a class per tag by default. Leave it unset for the standalone functions query plugins use. |
| `dataReturnType` | `returnType`, default `'full'` |
| `parser: 'zod'` | `validator: 'zod'` |
| `parser: 'client'` | `validator: false`, the default. |
| `operations`, `clientType: 'staticClass'`, `bundle`, `urlType` | Removed. The client goes to `.kubb/client.ts`. URL-only helpers need a custom plugin. |
| `importPath` to your own client module | `pluginClient({ importPath })`, without `sdk` or `baseURL`. |

- Calls return the full result object. Read `data`, call `.unwrap()`, or set `returnType: 'data'` for the body alone.
- To inspect an error without throwing, pass `throwOnError: false` on the call.

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

- Request input types are named `*Options` and keep spec names such as `pet_id`.
- Enums default to a const-asserted object plus a `*Key` type union. Inline enum names are scoped to their operation.

See [TypeScript options](/extensions/kubb-labs/plugin-ts/options).

## Zod {#plugin-zod}

Upgrade `zod` to v4.

| v4 | v5 |
| --- | --- |
| `version` | Removed. v5 prints Zod 4. |
| `typed: true` | Removed. Set `inferred: true` to export `z.infer` type aliases. |
| Inferred alias `PetSchema` | `PetSchemaType` |
| `wrapOutput` | A `printer.nodes` override that decorates `this.base(node)`. |
| `operations` | Removed. Its operation and path maps need a custom plugin. |
| `listPets200Schema` | `listPetsStatus200Schema` |

See [Zod options](/extensions/kubb-labs/plugin-zod/options).

## React Query {#plugin-react-query}

- Register a client plugin: Axios, Fetch, or `@kubb/plugin-client`.
- Move `baseURL` and validation to the client plugin, and remove `parser`.
- Set `hooks: true` to keep the `use*` hooks.
- Replace `*MutationKey` type imports with the runtime key helper.
- `TData` holds only 2xx responses, and errors use `TError`.
- To defer a request, set TanStack Query's `enabled` or `skipToken`. The generated `enabled` guard is gone.

See [React Query options](/extensions/kubb-labs/plugin-react-query/options).

## Vue Query {#plugin-vue-query}

Apply the [React Query](#plugin-react-query) changes. See [Vue Query options](/extensions/kubb-labs/plugin-vue-query/options).

## SWR {#plugin-swr}

Apply the client and validation changes from [React Query](#plugin-react-query), and remove `mutation.paramsToTrigger`:

```typescript [src/app.ts]
useUpdatePet().trigger({ path: { petId }, body: pet })
```

To skip a request, set `shouldFetch: false`. The parameter-presence guard is gone. See [SWR options](/extensions/kubb-labs/plugin-swr/options).

## Faker {#plugin-faker}

Remove `paramsCasing` and `mapper`. Use macros or printers instead. See [Faker options](/extensions/kubb-labs/plugin-faker/options).

## MSW {#plugin-msw}

`parser`, `handlers`, and `baseURL` keep their v4 behavior. See [MSW options](/extensions/kubb-labs/plugin-msw/options).

## Cypress {#plugin-cypress}

- Request helpers take grouped `*Options`, then the unchanged `Partial<Cypress.RequestOptions>`.
- Remove `dataReturnType`. Helpers yield the body as `Cypress.Chainable<T>`.
- Imports use `*Options` and `*Response` names.

See [Cypress options](/extensions/kubb-labs/plugin-cypress/options).

## MCP {#plugin-mcp}

- Register TypeScript, Zod, and an Axios or Fetch client, which `client` selects.
- Move `baseURL` to that client and remove `paramsCasing`.

See [MCP options](/extensions/kubb-labs/plugin-mcp/options).

## Verify the upgrade {#verify-the-upgrade}

Run `kubb generate`, review the changed files, and type-check your app. Most errors come from renamed imports, such as `Status<code>` response names and `SchemaType` Zod types.

## Less common changes {#v4-upgrade-edge-cases}

Check the rows for your plugins.

| Area | Change |
| --- | --- |
| Output | `format: 'auto'` and `lint: 'auto'` try the oxc tools first. |
| HTTP clients | The client's `auth` resolver follows the spec's security schemes. |
| TypeScript | Open string unions keep suggestions with `(string & {})`. Shared fields of a discriminated union move into a common intersection. JSDoc drops the format suffix from `@type`, adds the spec's examples, and adds `@type object` for objects. |
| Zod | Output uses chained Zod 4 calls, functional wrappers with `mini: true`, and getters only for circular references. |
| React Query | `client` is `'axios' \| 'fetch' \| 'client'`, detected when exactly one is registered. The trailing client config excludes `path`, `query`, `body`, `headers`, and `url`. Suspense hooks always run. |
| Vue Query | Parameter groups accept `MaybeRefOrGetter`, unwrapped with `toValue()`. |
| Faker | Factories such as `createPet` keep their names and take a generic `TData`, so overrides keep their types. |
| MSW | A handler for an operation with a body accepts an `HttpResponseResolver` typed against that body. |
| Cypress | HTTP methods are uppercase. `baseURL`, `exclude`, `include`, and `override` keep their shape. There is no validator option. |
| MCP | Handlers receive grouped `*Options` plus the MCP `ServerContext`, call the generated client operations, and read `res.data`. |
