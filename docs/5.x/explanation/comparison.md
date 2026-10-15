---
layout: doc
title: Kubb vs orval, HeyAPI, and openapi-typescript
description: Feature-by-feature comparison of Kubb and Kubb Studio against
  orval, HeyAPI, and openapi-typescript.
outline:
  - 2
  - 3
order: 3
navigation:
  title: Comparison
  icon: i-iconoir-mirror
---

# Kubb vs orval, HeyAPI, and openapi-typescript

Kubb, [orval](https://orval.dev), [HeyAPI](https://heyapi.dev), and [openapi-typescript](https://openapi-ts.dev) all generate code from OpenAPI specs. The tables compare generated outputs, response handling, runtime behavior, and what [Kubb Studio](#kubb-studio) adds around the generator. Each cell was checked against the project's own docs in October 2026.

## Plugin and feature coverage

Legend:

- ✅ Built in, no extra config.
- 🟡 Through a third-party or community plugin.
- 🔶 Supported, but needs extra user code.
- 🛑 Not officially supported.

| Feature                                                          | Kubb | orval | HeyAPI         |   openapi-ts   |
| ---------------------------------------------------------------- | :--: | :---: | :------------- | :------------: |
| [OpenAPI 2.0, 3.0, 3.1 input](/extensions/kubb-labs/adapter-oas) |  ✅  |  ✅   | ✅             | 🔶<sup>1</sup> |
| [TypeScript types](/extensions/kubb-labs/plugin-ts)              |  ✅  |  ✅   | ✅             |       ✅       |
| [HTTP client (Axios, Fetch)](/extensions/kubb-labs/plugin-axios) |  ✅  |  ✅   | ✅             | 🔶<sup>2</sup> |
| [React Query hooks](/extensions/kubb-labs/plugin-react-query)    |  ✅  |  ✅   | ✅             | 🟡<sup>3</sup> |
| [Vue Query composables](/extensions/kubb-labs/plugin-vue-query)  |  ✅  |  ✅   | ✅             |       🛑       |
| [SWR hooks](/extensions/kubb-labs/plugin-swr)                    |  ✅  |  ✅   | 🛑<sup>6</sup> | 🟡<sup>4</sup> |
| [Zod validation schemas](/extensions/kubb-labs/plugin-zod)       |  ✅  |  ✅   | ✅<sup>5</sup> |       🛑       |
| [MSW request handlers](/extensions/kubb-labs/plugin-msw)         |  ✅  |  ✅   | ✅<sup>7</sup> |       🛑       |
| [Faker.js mock data](/extensions/kubb-labs/plugin-faker)         |  ✅  |  ✅   | ✅<sup>7</sup> |       🛑       |
| [Cypress E2E tests](/extensions/kubb-labs/plugin-cypress)        |  ✅  |  🛑   | 🛑             |       🛑       |
| [MCP server](/extensions/kubb-labs/plugin-mcp)                   |  ✅  |  ✅   | 🛑             |       🛑       |
| [Redoc API documentation](/extensions/kubb-labs/plugin-redoc)    |  ✅  |  🛑   | 🛑             |       🛑       |
| [Barrel index files](/extensions/kubb-labs/plugin-barrel)        |  ✅  |  ✅   | ✅             |       🛑       |

Notes:

1. openapi-typescript reads OpenAPI 3.0 and 3.1 only, so a Swagger 2.0 document has to be up-converted first. Kubb, orval, and HeyAPI accept 2.0 and up-convert it for you.
2. openapi-typescript generates types only. The typed client comes from its `openapi-fetch` runtime, not per-operation code, and `openapi-fetch` is now in [maintenance mode](https://github.com/openapi-ts/openapi-typescript/discussions/2559).
3. openapi-typescript generates no hooks. React Query support comes from the first-party [`openapi-react-query`](https://www.npmjs.com/package/openapi-react-query) runtime, also in maintenance mode.
4. openapi-typescript relies on the community [`swr-openapi`](https://github.com/htunnicliff/swr-openapi) package.
5. HeyAPI also generates Valibot schemas alongside Zod.
6. HeyAPI lists its SWR plugin as planned.
7. HeyAPI marks its MSW and Faker plugins as in progress.

## Type safety and response handling

Kubb exposes a status-discriminated result that narrows response bodies at runtime. The table compares operation typing and error handling.

| Feature                                                                                          | Kubb  |     orval      | HeyAPI         |
| ------------------------------------------------------------------------------------------------ | :---: | :------------: | :------------- |
| [Status-discriminated response result](/extensions/kubb-labs/plugin-fetch/guides/error-handling) |  ✅   | 🔶<sup>1</sup> | 🔶<sup>2</sup> |
| Multiple success (2xx) responses                                                                 |  ✅   |       ✅       | ✅             |
| Multiple content types per response                                                              |  ✅   |       ✅       | 🛑<sup>3</sup> |
| `default` and wildcard (`4XX`, `5XX`) responses                                                  |  ✅   | ✅<sup>4</sup> | ✅             |
| [Typed error responses](/extensions/kubb-labs/plugin-fetch/guides/error-handling)                |  ✅   | 🔶<sup>5</sup> | ✅             |
| [Throw or return the error per call](/extensions/kubb-labs/plugin-fetch/guides/error-handling)   |  ✅   |       🛑       | ✅             |
| [Zod v4 schemas tied to the types](/extensions/kubb-labs/plugin-zod)                             |  ✅   |       ✅       | ✅             |
| Recursive schemas                                                                                |  ✅   |       ✅       | ✅             |
| Server-side schema validation                                                                    |  ✅   |       ✅       | ✅             |

Notes:

1. Only orval's `fetch` client emits a status-narrowable union. Its axios and query clients return the success type and take the error type on the side.
2. HeyAPI builds a status-keyed type map you index (`Responses[200]`), but the SDK returns a flat `{ data, error }` pair with no `status` to switch on.
3. On `@hey-api/openapi-ts` v0.99.0, a response with both `application/json` and `application/xml` keeps only the JSON shape. Kubb and orval emit a variant per content type.
4. orval expands `4XX` and `5XX` into unions of concrete codes. Kubb and HeyAPI keep the range key.
5. orval types the error body in its `fetch` client, or once you wire `ErrorType` or `override.swr.generateErrorTypes`. Otherwise it stays `Error`.

openapi-typescript is omitted here. It ships no generated client, so the runtime rows do not apply.

## Client runtime

Kubb serializes OpenAPI parameter styles and supports codecs per media type. See [serialization](/extensions/kubb-labs/plugin-fetch/guides/serialization) for the runtime contract.

| Feature                                                                                                                      | Kubb  | orval          | HeyAPI         |
| ---------------------------------------------------------------------------------------------------------------------------- | :---: | :------------- | :------------- |
| [Parameter styles from the spec](/docs/5.x/reference/serialization#parameter-styles)                                         |  ✅   | 🔶<sup>1</sup> | 🔶<sup>2</sup> |
| Request body serializers (JSON, form-data, urlencoded)                                                                       | ✅<sup>3</sup> | ✅    | ✅             |
| [Pluggable codecs per media type](/extensions/kubb-labs/plugin-fetch/guides/serialization#encode-request-bodies) (XML, YAML) |  ✅   | 🛑<sup>4</sup> | 🛑<sup>4</sup> |
| [Runtime body validation](/extensions/kubb-labs/plugin-fetch/guides/error-handling#validation-failures)                      | ✅<sup>5</sup> | 🔶<sup>5</sup> | ✅<sup>5</sup> |
| [Server-sent events and streaming](/extensions/kubb-labs/plugin-fetch/guides/server-sent-events)                             |  ✅   | 🔶<sup>6</sup> | ✅             |

Notes:

1. Only orval's `fetch` client reads `style` and `explode` from the spec. Its axios and query clients interpolate path parameters directly and leave query encoding to axios or a `qs` config.
2. HeyAPI serializes path parameters per parameter but runs one global query serializer, and does not style header or cookie parameters.
3. All three encode JSON, `multipart/form-data`, and `application/x-www-form-urlencoded`. Kubb also honors the OpenAPI `encoding` object, so a form part can set its own content type and style.
4. orval and HeyAPI expose a single body serializer and one response transformer, so a new media type means replacing them, not registering one.
5. Off by default. Kubb validates request and response bodies through any Standard Schema validator (Zod, valibot, arktype). HeyAPI validates both with Zod or Valibot. orval validates responses only, with Zod.
6. orval streams NDJSON on its `fetch` client but has no server-sent events (`text/event-stream`) support. Kubb and HeyAPI consume SSE.

## Kubb Studio

[Kubb Studio](https://kubb.studio) is the web IDE for Kubb. It runs the same generator through an agent on your machine. The table lists what Studio adds on top of it.

| Feature                                                                                                    |  Kubb Studio   |     orval      |     HeyAPI     | openapi-ts |
| ---------------------------------------------------------------------------------------------------------- | :------------: | :------------: | :------------: | :--------: |
| Generation on your own machine                                                                             | ✅<sup>1</sup> |       ✅       |       ✅       |     ✅     |
| [API skills for Claude Code, Cursor, and Codex](/docs/5.x/integrations/studio#give-your-ai-tools-your-api) | ✅<sup>2</sup> |       🛑       |       🛑       |     🛑     |
| One AI plugin marketplace for your team                                                                    | ✅<sup>2</sup> |       🛑       |       🛑       |     🛑     |
| [Review added, changed, and removed files](/docs/5.x/integrations/studio#review-and-save-generated-files)  |       ✅       |       🛑       |       🛑       |     🛑     |
| Edit `kubb.config.ts` from the browser                                                                     |       ✅       |       🛑       |       🛑       |     🛑     |
| [Installable snapshot for every pull request](/docs/5.x/integrations/github-actions)                       |       ✅       |       🛑       |       🛑       |     🛑     |
| Shared agents for the whole team                                                                           |       ✅       |       🛑       |       🛑       |     🛑     |
| Try without installing anything                                                                            |       ✅       | ✅<sup>3</sup> | 🟡<sup>4</sup> |     🛑     |

Notes:

1. Pair the `kubb studio` CLI or the `kubblabs/kubb-agent` Docker image. The agent never uploads your local spec file. With `--allow-read`, Studio can read the generated files and the spec as Kubb parsed it.
2. On the Pro plan, with an agent started with `--allow-read`. Studio renders the skills from the Kubb AST, so they use the names Kubb generates, and the code your AI tools write calls your generated clients instead of guessing endpoints. A published plugin keeps the servers, operations, and schemas its skills describe.
3. The [orval playground](https://orval.dev/playground) generates code from a spec and config you edit in the browser.
4. HeyAPI links a demo project on StackBlitz. Its hosted [Hey API Platform](https://heyapi.dev/openapi-ts/configuration/input) also stores spec versions as a registry. Studio has no spec registry and keeps no copy of your spec file.

## When not to use Kubb

- You use only a few endpoints that rarely change.
- You have no OpenAPI spec and won't write one.
- You need a non-OpenAPI format now and won't write a custom adapter.
