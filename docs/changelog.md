---
title: Changelog
---

# Changelog

## 3.0.0-alpha.20

- Separate plugin/package for Solid-Query: `@kubb/plugin-solid-query`

```typescript twoslash [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginSolidQuery } from '@kubb/plugin-solid-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSolidQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

- Separate plugin/package for Svelte-Query: `@kubb/plugin-svelte-query`

```typescript twoslash [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```


- Separate plugin/package for Vue-Query:  `@kubb/plugin-vue-query`

```typescript twoslash [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginVueQuery } from '@kubb/plugin-vue-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginVueQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

## 3.0.0-alpha.16

- Separate plugin/package for React-Query: `@kubb/plugin-react-query`

```typescript twoslash [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```
