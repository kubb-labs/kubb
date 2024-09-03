---
layout: doc

title: Config
outline: deep
---

# Options
This page is a reference to the different options you can use for configuring your Kubb config.
By setting the following options you can override the default behavior of Kubb and even extend it with your plugins.

## name
Optional config name to show in CLI output.

- **Type:** `string` <br/>

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

## root
Project root directory. Can be an absolute path, or a path relative to the location of the config file itself.

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

## input
You can use `input.path` or `input.data` depending on the needs you have.

### input.path
Define your Swagger/OpenAPI file. This can be an absolute path or a path relative to the `root`.

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

## output

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


## plugins
- **Type:** `Array<KubbUserPlugin>` <br/>

An array of Kubb plugins to use. The plugin/package can have some extra options defined by the plugin.
Sometimes a plugin is dependent on another plugin, if that's the case you will get an error back from the plugin you installed.([see pre](/reference/pluginManager/)).<br/><br/>

How to use and set up plugins, see [plugins](/plugins/overview).

::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      output: {
        path: 'schemas',
      },
      validate: true,
    }),
  ],
})
```
:::


## output

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
