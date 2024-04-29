---
layout: doc

title: Config
outline: deep
---

# input

You can use `input.path` or `input.data` depending on the needs you have.

### input.path

Define your Swagger/OpenAPI file. This can be an absolute path or a path relative to the `root`.

- **Type:** `string` <br/>
- **Required:** `true`

::: code-group

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

:::

### input.data

`string` or `object` containing your Swagger/OpenAPI

- **Type:** `string | unknown` <br/>
- **Required:** `true`

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

import petStore from './petStore.yaml'

export default defineConfig({
  input: {
    data: petStore,
  },
  output: {
    path: './src/gen',
  },
})
```

:::
