---
layout: doc

title: Config
outline: deep
---

# name

Optional config name to show in CLI output.

- **Type:** `string` <br/>
- **Default:** `process.cwd()` <br/>

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  name: 'petStore',
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
  },
  {
    name: 'petStoreV2',
    root: '.',
    input: {
      path: './petStoreV2.yaml',
    },
    output: {
      path: './src/gen-v2',
    },
  },
])
```
