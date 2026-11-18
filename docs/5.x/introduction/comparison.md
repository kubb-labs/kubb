---
layout: doc
title: Kubb vs orval, HeyAPI, and openapi-typescript
description: Compare Kubb with orval, HeyAPI, and openapi-typescript on speed, memory, generated outputs, OpenAPI 3.2 support, type safety, and client runtime.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Comparison
  icon: i-iconoir-mirror
---

# Kubb vs orval, HeyAPI, and openapi-typescript

Kubb, [orval](https://orval.dev), [HeyAPI](https://heyapi.dev), and [openapi-typescript](https://openapi-ts.dev) all generate code from OpenAPI specs. This page shows where they differ.

## Switch to Kubb

Each guide replaces one output at a time.

::card-group

:::card{title="Move from orval" icon="i-iconoir-git-fork" to="/docs/5.x/migrate/from-orval"}
Types, client, query hooks, Zod schemas, and MSW mocks.
:::

:::card{title="Move from HeyAPI" icon="i-iconoir-git-fork" to="/docs/5.x/migrate/from-hey-api"}
Types, SDK and client, TanStack Query, and Zod schemas.
:::

:::card{title="Move from openapi-typescript" icon="i-iconoir-git-fork" to="/docs/5.x/migrate/from-openapi-typescript"}
Types, `openapi-fetch`, and `openapi-react-query`.
:::

::

> [!WARNING]
> openapi-typescript is no longer maintained. In December 2025, its maintainers put `openapi-fetch`, `openapi-react-query`, and `openapi-metadata` into [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559). In September 2026, openapi-typescript itself followed, with [no more updates, security fixes included](https://github.com/openapi-ts/openapi-typescript/issues/2874).

## Where Kubb differs

| Difference | Details |
| --- | --- |
| Full builds are the fastest of the three and use the least memory on every spec we measured, from 0.1 MB to 29.7 MB. | [Speed, CPU time, and memory](#speed-cpu-time-and-memory) |
| One config generates types, clients, query hooks, Zod, MSW, Faker, Cypress tests, an MCP server, and Redoc docs. | [Plugin and feature coverage](#plugin-and-feature-coverage) |
| Clients return a result you narrow by status code, and each call picks whether errors throw. | [Type safety and response handling](#type-safety-and-response-handling) |
| The runtime follows the spec's parameter styles, encodes bodies per media type, and reads server-sent events. | [Client runtime](#client-runtime) |
| File review, pull request snapshots, and API skills for AI tools. | [Kubb Studio](#kubb-studio) |

We checked each cell in the tables below against each project's docs in October 2026, and the OpenAPI 3.2 row by generating from a 3.2 spec in November 2026.

## Speed, CPU time, and memory

Each tool generates types, Zod schemas, and a fetch client. Switch between one file per generator or many, and between speed, CPU time, and memory.

With one file per generator, Kubb is the fastest and uses the least memory on every spec: 1.9 to 2.3× faster than HeyAPI and 1.3 to 5.9× faster than orval. With multiple files, Kubb still leads on speed and memory. HeyAPI and orval use less CPU time on the 1.1 MB spec, and HeyAPI also on the 10.6 MB spec.

::tool-benchmark
::

How we measured, in November 2026:

- The median of five runs (three on the 10.6 MB and 29.7 MB specs) on Node 22, Linux x64 with 4 cores.
- kubb 5.20.1 (`@kubb/plugin-ts` 5.5.3, `@kubb/plugin-zod` 5.9.3, `@kubb/plugin-fetch` 6.0.3), `@hey-api/openapi-ts` 0.99.0, and orval 8.47.0.
- Synthetic OpenAPI 3.0 specs with 10 to 2,800 resources, with spec and runtime validation off in every tool.
- With multiple files, Kubb uses directory mode grouped by tag and orval uses `tags-split`. HeyAPI has no option to split its output.

## Plugin and feature coverage

✅ built in · 🟠 partial · 🟡 community or separate package · 🔶 needs extra user code · 🛑 not supported

| Feature                                                          |      Kubb      |     orval      |     HeyAPI     |   openapi-ts   |
| ---------------------------------------------------------------- | :------------: | :------------: | :------------: | :------------: |
| [OpenAPI 2.0 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       | 🛑<sup>1</sup> |
| [OpenAPI 3.0 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       |       ✅       |
| [OpenAPI 3.1 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       |       ✅       |
| [OpenAPI 3.2 input](/extensions/kubb-labs/adapter-oas)           | ✅<sup>2</sup> | 🟠<sup>3</sup> | 🛑<sup>4</sup> | 🛑<sup>4</sup> |
| [TypeScript types](/extensions/kubb-labs/plugin-ts)              |       ✅       |       ✅       |       ✅       |       ✅       |
| [HTTP client (Axios, Fetch)](/extensions/kubb-labs/plugin-axios) |       ✅       |       ✅       |       ✅       | 🔶<sup>5</sup> |
| [React Query hooks](/extensions/kubb-labs/plugin-react-query)    |       ✅       |       ✅       |       ✅       | 🟡<sup>5</sup> |
| [Vue Query composables](/extensions/kubb-labs/plugin-vue-query)  |       ✅       |       ✅       |       ✅       |       🛑       |
| [SWR hooks](/extensions/kubb-labs/plugin-swr)                    |       ✅       |       ✅       | 🛑<sup>6</sup> |       🟡       |
| [Zod validation schemas](/extensions/kubb-labs/plugin-zod)       |       ✅       |       ✅       |       ✅       |       🛑       |
| [MSW request handlers](/extensions/kubb-labs/plugin-msw)         |       ✅       |       ✅       | 🛑<sup>6</sup> |       🛑       |
| [Faker.js mock data](/extensions/kubb-labs/plugin-faker)         |       ✅       |       ✅       | 🛑<sup>6</sup> |       🛑       |
| [Cypress E2E tests](/extensions/kubb-labs/plugin-cypress)        |       ✅       |       🛑       |       🛑       |       🛑       |
| [MCP server](/extensions/kubb-labs/plugin-mcp)                   |       ✅       |       ✅       |       🛑       |       🛑       |
| [Redoc API documentation](/extensions/kubb-labs/plugin-redoc)    |       ✅       |       🛑       |       🛑       |       🛑       |
| [Barrel index files](/extensions/kubb-labs/plugin-barrel)        |       ✅       |       ✅       |       ✅       |       🛑       |

1. openapi-typescript 7 reads 3.0 and 3.1 only. Convert Swagger 2.0 first, or use version 5.
2. Kubb generates every OpenAPI 3.2 feature we tested: the `QUERY` method, `additionalOperations`, `querystring` parameters, `itemSchema` for server-sent events and JSON Lines, and `components/mediaTypes`.
3. orval 8.48.0 generates `QUERY` operations. It skips `additionalOperations` and `querystring` parameters, and types `itemSchema` responses and media type references as `unknown`.
4. HeyAPI 0.99.0 and openapi-typescript 7.13.0 read a 3.2 document without an error, but skip `QUERY` and `additionalOperations` operations, drop `querystring` parameters, and type the other 3.2 features as `unknown`.
5. openapi-typescript generates types only. Clients and hooks come from the `openapi-fetch` and `openapi-react-query` runtimes, all in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/issues/2874).
6. HeyAPI lists SWR as planned and MSW and Faker as in progress.

## Type safety and response handling

openapi-typescript ships no generated client, so this table and the next leave it out.

| Feature                                                                                          | Kubb |     orval      |     HeyAPI     |
| ------------------------------------------------------------------------------------------------ | :--: | :------------: | :------------: |
| [Status-discriminated response result](/extensions/kubb-labs/plugin-fetch/guides/error-handling) |  ✅  | 🔶<sup>1</sup> | 🔶<sup>2</sup> |
| Multiple success (2xx) responses                                                                 |  ✅  |       ✅       |       ✅       |
| Multiple content types per response                                                              |  ✅  |       ✅       | 🛑<sup>3</sup> |
| `default` and wildcard (`4xx`, `5xx`) responses                                                  |  ✅  |       ✅       |       ✅       |
| [Typed error responses](/extensions/kubb-labs/plugin-fetch/guides/error-handling)                |  ✅  | 🔶<sup>1</sup> |       ✅       |
| [Throw or return the error per call](/extensions/kubb-labs/plugin-fetch/guides/error-handling)   |  ✅  |       🛑       |       ✅       |
| [Zod v4 schemas tied to the types](/extensions/kubb-labs/plugin-zod)                             |  ✅  |       ✅       |       ✅       |

1. Only orval's `fetch` client returns a status union and a typed error body. Its axios and query clients return the success type.
2. HeyAPI returns `{ data, error }` with no `status` to switch on.
3. HeyAPI 0.99.0 keeps only the JSON shape when a response also offers XML.

## Client runtime

[Configure serialization](/extensions/kubb-labs/plugin-fetch/guides/serialization) has Kubb's runtime contract.

| Feature                                                                                                                      | Kubb |     orval      |     HeyAPI     |
| ---------------------------------------------------------------------------------------------------------------------------- | :--: | :------------: | :------------: |
| [Parameter styles from the spec](/extensions/kubb-labs/plugin-fetch/guides/serialization#parameter-styles)                   |  ✅  | 🔶<sup>1</sup> | 🔶<sup>2</sup> |
| OpenAPI `encoding` object for form bodies                                                                                    |  ✅  |       🛑       |       🛑       |
| [Pluggable codecs per media type](/extensions/kubb-labs/plugin-fetch/guides/serialization#encode-request-bodies) (XML, YAML) |  ✅  |       🛑       |       🛑       |
| [Runtime request and response validation](/extensions/kubb-labs/plugin-fetch/guides/error-handling#validation-failures)      |  ✅  | 🔶<sup>3</sup> |       ✅       |
| [Server-sent events](/extensions/kubb-labs/plugin-fetch/guides/server-sent-events)                                           |  ✅  |       🛑       |       ✅       |

1. Only orval's `fetch` client reads `style` and `explode`.
2. HeyAPI uses one global query serializer and does not style header or cookie parameters.
3. orval validates responses only, with Zod. Kubb accepts any Standard Schema validator (Zod, Valibot, ArkType).

## Kubb Studio

[Kubb Studio](https://kubb.studio) is the web IDE for Kubb. An agent on your machine runs Kubb and never uploads your spec. The other three tools have no equivalent for:

- [API skills for Claude Code, Cursor, and Codex](/docs/5.x/integrations/studio#give-your-ai-tools-your-api), built from your spec, so AI tools call your generated clients (Pro plan).
- One AI plugin marketplace and shared agents for the team.
- [Review added, changed, and removed files](/docs/5.x/integrations/studio#review-and-save-generated-files) before you save them.
- Edit `kubb.config.ts` from the browser.
- [An installable snapshot for every pull request](/docs/5.x/integrations/github-actions).
- Try it in the browser without installing anything.

To try the others in the browser, orval has a [playground](https://orval.dev/playground) and HeyAPI has a StackBlitz demo.

## When not to use Kubb

- You use only a few endpoints that rarely change.
- You have no OpenAPI spec and won't write one.
- You need a non-OpenAPI format now and won't write a custom adapter.
