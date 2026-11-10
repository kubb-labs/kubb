---
layout: doc
title: Kubb vs orval, HeyAPI, and openapi-typescript
description: Compare Kubb with orval, HeyAPI, and openapi-typescript on speed, memory, install size, generated outputs, type safety, client runtime, and Kubb Studio.
outline:
  - 2
  - 3
order: 3
navigation:
  title: Comparison
  icon: i-iconoir-mirror
---

# Kubb vs orval, HeyAPI, and openapi-typescript

Kubb, [orval](https://orval.dev), [HeyAPI](https://heyapi.dev), and [openapi-typescript](https://openapi-ts.dev) all generate code from OpenAPI specs. We checked each cell against the project's own docs in October 2026.

Kubb differs from the others in five ways:

- For a full build, it uses less memory than HeyAPI and orval on every [spec we measured](#speed-memory-and-install-size), and has the smallest install.
- One config generates types, clients, query hooks, Zod, MSW, Faker, Cypress tests, an MCP server, and Redoc docs. See [plugin coverage](#plugin-and-feature-coverage).
- Its clients return a result you narrow by status code, and you choose per call whether errors throw. See [type safety](#type-safety-and-response-handling).
- Its runtime follows the spec's parameter styles, encodes bodies per media type, and reads server-sent events. See [client runtime](#client-runtime).
- [Kubb Studio](#kubb-studio) adds file review, pull request snapshots, and API skills for AI tools.

## Speed, memory, and install size

Switch between a full build (types, Zod schemas, and a fetch client) and types only, where openapi-typescript joins.

In a full build, Kubb is the fastest on the three smaller specs and ties HeyAPI on Cloudflare. In types only, Kubb does not lead every spec. openapi-typescript is the fastest on the three larger specs, and orval uses the least memory on three of the four.

::tool-benchmark
::

Median of five runs on Node 22, Linux x64 with 4 cores, November 2026. Compared kubb 5.15.3 (`@kubb/plugin-ts` 5.4.0, `@kubb/plugin-zod` 5.8.0, `@kubb/plugin-fetch` 5.11.0) with `@hey-api/openapi-ts` 0.99.0, orval 8.46.0, and openapi-typescript 7.13.0. orval has no types-only mode, so it writes models only there. Install size is `node_modules` after a clean `npm install` of each tool's packages for that output.

## Plugin and feature coverage

✅ built in · 🟠 partial · 🟡 community or separate package · 🔶 needs extra user code · 🛑 not supported

| Feature                                                          |      Kubb      |     orval      |     HeyAPI     |   openapi-ts   |
| ---------------------------------------------------------------- | :------------: | :------------: | :------------: | :------------: |
| [OpenAPI 2.0 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       | 🛑<sup>1</sup> |
| [OpenAPI 3.0 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       |       ✅       |
| [OpenAPI 3.1 input](/extensions/kubb-labs/adapter-oas)           |       ✅       |       ✅       |       ✅       |       ✅       |
| [OpenAPI 3.2 input](/extensions/kubb-labs/adapter-oas)           | 🟠<sup>2</sup> | 🛑<sup>3</sup> | 🛑<sup>3</sup> | 🛑<sup>3</sup> |
| [TypeScript types](/extensions/kubb-labs/plugin-ts)              |       ✅       |       ✅       |       ✅       |       ✅       |
| [HTTP client (Axios, Fetch)](/extensions/kubb-labs/plugin-axios) |       ✅       |       ✅       |       ✅       | 🔶<sup>4</sup> |
| [React Query hooks](/extensions/kubb-labs/plugin-react-query)    |       ✅       |       ✅       |       ✅       | 🟡<sup>4</sup> |
| [Vue Query composables](/extensions/kubb-labs/plugin-vue-query)  |       ✅       |       ✅       |       ✅       |       🛑       |
| [SWR hooks](/extensions/kubb-labs/plugin-swr)                    |       ✅       |       ✅       | 🛑<sup>5</sup> |       🟡       |
| [Zod validation schemas](/extensions/kubb-labs/plugin-zod)       |       ✅       |       ✅       |       ✅       |       🛑       |
| [MSW request handlers](/extensions/kubb-labs/plugin-msw)         |       ✅       |       ✅       | 🛑<sup>5</sup> |       🛑       |
| [Faker.js mock data](/extensions/kubb-labs/plugin-faker)         |       ✅       |       ✅       | 🛑<sup>5</sup> |       🛑       |
| [Cypress E2E tests](/extensions/kubb-labs/plugin-cypress)        |       ✅       |       🛑       |       🛑       |       🛑       |
| [MCP server](/extensions/kubb-labs/plugin-mcp)                   |       ✅       |       ✅       |       🛑       |       🛑       |
| [Redoc API documentation](/extensions/kubb-labs/plugin-redoc)    |       ✅       |       🛑       |       🛑       |       🛑       |
| [Barrel index files](/extensions/kubb-labs/plugin-barrel)        |       ✅       |       ✅       |       ✅       |       🛑       |

1. openapi-typescript 7 reads 3.0 and 3.1 only. Convert Swagger 2.0 first, or use version 5.
2. Kubb reads every OpenAPI 3.2 field into its AST, from `itemSchema` for streamed responses to `$self`, tag `parent` and the XML `nodeType`. A 3.2 document is not validated until `@readme/openapi-parser` supports 3.2.
3. orval, HeyAPI, and openapi-typescript list no OpenAPI 3.2 support in their docs. An orval [discussion](https://github.com/orval-labs/orval/discussions/3544) asks for it.
4. openapi-typescript generates types only. Clients and hooks come from the `openapi-fetch` and `openapi-react-query` runtimes, both in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559).
5. HeyAPI lists SWR as planned and MSW and Faker as in progress.

## Type safety and response handling

openapi-typescript ships no generated client, so it is left out of this table and the next one.

| Feature                                                                                          | Kubb |     orval      |     HeyAPI     |
| ------------------------------------------------------------------------------------------------ | :--: | :------------: | :------------: |
| [Status-discriminated response result](/extensions/kubb-labs/plugin-fetch/guides/error-handling) |  ✅  | 🔶<sup>1</sup> | 🔶<sup>2</sup> |
| Multiple success (2xx) responses                                                                 |  ✅  |       ✅       |       ✅       |
| Multiple content types per response                                                              |  ✅  |       ✅       | 🛑<sup>3</sup> |
| `default` and wildcard (`4XX`, `5XX`) responses                                                  |  ✅  |       ✅       |       ✅       |
| [Typed error responses](/extensions/kubb-labs/plugin-fetch/guides/error-handling)                |  ✅  | 🔶<sup>1</sup> |       ✅       |
| [Throw or return the error per call](/extensions/kubb-labs/plugin-fetch/guides/error-handling)   |  ✅  |       🛑       |       ✅       |
| [Zod v4 schemas tied to the types](/extensions/kubb-labs/plugin-zod)                             |  ✅  |       ✅       |       ✅       |

1. Only orval's `fetch` client returns a status union and a typed error body. Its axios and query clients return the success type.
2. HeyAPI returns `{ data, error }` with no `status` to switch on.
3. HeyAPI 0.99.0 keeps only the JSON shape when a response also offers XML.

## Client runtime

See [serialization](/extensions/kubb-labs/plugin-fetch/guides/serialization) for Kubb's runtime contract.

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

[Kubb Studio](https://kubb.studio) is the web IDE for Kubb. It runs the generator through an agent on your machine, and the agent never uploads your spec file. orval, HeyAPI, and openapi-typescript have no equivalent for the features below.

- [API skills for Claude Code, Cursor, and Codex](/docs/5.x/integrations/studio#give-your-ai-tools-your-api), built from your spec, so AI tools call your generated clients instead of guessing endpoints (Pro plan).
- One AI plugin marketplace and shared agents for the whole team.
- [Review added, changed, and removed files](/docs/5.x/integrations/studio#review-and-save-generated-files) before you save them.
- Edit `kubb.config.ts` from the browser.
- [An installable snapshot for every pull request](/docs/5.x/integrations/github-actions).
- Try it in the browser without installing anything.

To try the others without installing them, orval has a [playground](https://orval.dev/playground) and HeyAPI has a StackBlitz demo.

## When not to use Kubb

- You use only a few endpoints that rarely change.
- You have no OpenAPI spec and won't write one.
- You need a non-OpenAPI format now and won't write a custom adapter.
