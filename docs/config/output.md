---
layout: doc

title: Config
outline: deep
---

# output

### output.path

Path to be used to export all generated files.<br/>
This can be an absolute path, or a path relative from the defined `root` option.

- **Type:** `string` <br/>
- **Required:** `true`

::: code-group

```typescript [kubb.config.ts]
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

### output.clean

Clean the output directory before each build.

- **Type:** `boolean` <br/>

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
})
```

:::

### output.write

Write files to the filesystem.

- **Type:** `boolean` <br/>
- **Default:** `true`

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    write: true,
  },
})
```

:::
