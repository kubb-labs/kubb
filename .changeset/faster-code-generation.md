---
"kubb": minor
"@kubb/adapter-oas": patch
"@kubb/ast": patch
"@kubb/renderer-jsx": patch
---

Generate code up to 5.4x faster than v4.

On the [OpenAI spec](https://github.com/openai/openai-openapi) (288 operations, 2.9 MB), generating types, an Axios client, Zod schemas, and Faker mocks drops from 18.4 seconds in v4 to 3.4 seconds in v5, median of five runs. Two changes drive the gap. Every v4 plugin parsed the OpenAPI spec on its own, so four plugins read the same spec four times. In v5 the adapter parses it once and hands every plugin the same AST. The renderer also moved off React's async fiber runtime onto a synchronous walker over a tiny built-in JSX runtime, which drops the render step's own overhead along with the `react`/`react-reconciler` dependency.

See the [migration guide](/docs/5.x/migration#performance) for the full per-plugin-combination benchmark tables.
