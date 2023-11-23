---
layout: doc

title: Config
outline: deep
---

# root

Project root directory. Can be an absolute path, or a path relative from the location of the config file itself.

- **Type:** `string` <br/>
- **Default:** `process.cwd()` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

:::
