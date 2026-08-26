---
'@kubb/adapter-arazzo': minor
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Add `@kubb/adapter-arazzo`, an adapter for the [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html).

It reads an Arazzo workflow document, loads every OpenAPI document listed under `sourceDescriptions`, and converts each workflow into one operation with `protocol: 'arazzo'`. A workflow's `inputs` becomes a named `<Workflow>Inputs` schema on the request body, its `outputs` become a named `<Workflow>Outputs` schema on the `200` response, and its steps are carried on the node with their runtime expressions intact.

Output types come from resolving those expressions: `$response.body#/token` narrows to the `token` property of the step's success response, and `$steps.login.outputs.token` follows through to whatever that step's output resolves to. Anything the adapter cannot follow resolves to `unknown`.

```ts
import { defineConfig } from 'kubb'
import { adapterArazzo } from '@kubb/adapter-arazzo'

export default defineConfig({
  input: './workflows.arazzo.yaml',
  output: { path: './src/gen' },
  adapter: adapterArazzo(),
})
```

Supporting changes: `@kubb/ast` accepts `'arazzo'` as an operation `protocol`, and `@kubb/adapter-oas` exposes its document loading, `$ref` resolution, and schema conversion through a new `@kubb/adapter-oas/internal` subpath so another adapter can reuse them instead of duplicating them.
