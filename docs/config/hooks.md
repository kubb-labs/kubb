---
layout: doc

title: Config
outline: deep
---

# hooks

Hooks that will be called when a specific action is triggered in Kubb.

## hooks.done

Hook that will be triggered at the end of Kubb's generation.<br/>
Useful for running Prettier or ESLint to format/lint your code.

::: info
Type: `string | string[]` <br/>

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  hooks: {
    done: ['npx prettier --write .'],
  },
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

export default defineConfig({
  hooks: {
    done: 'npx prettier --write .',
  },
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
})
```

:::
