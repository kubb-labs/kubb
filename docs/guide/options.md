---
layout: doc

title: Options
outline: deep
---

# Options

This page is a reference to the different options you can use for configuring your Kubb config.
By setting the following options you can override the default behaviour of Kubb and even extend it with your own plugins.

## name

Optional config name to show in CLI output.

::: info
Type: `string` <br/>
Default: `process.cwd()` <br/>

::: code-group

```typescript [kubb.config.js]
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

```typescript [kubb.config.js]
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

:::

## root

Project root directory. Can be an absolute path, or a path relative from the location of the config file itself.

::: info
Type: `string` <br/>
Default: `process.cwd()` <br/>

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

### path

Define your Swagger/OpenAPI file.<br/>
This can be an absolute path or a path relative to the `root`.

::: info
Type: `string` <br/>
Required: `true`

::: code-group

```typescript [kubb.config.js]
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

### data

`string` or `object` containing your Swagger/OpenAPI

::: info
Type: `string | unknown` <br/>
Required: `true`

::: code-group

```typescript [kubb.config.js]
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

### path

Path to be used to export all generated files.<br/>
This can be an absolute path, or a path relative from the defined `root` option.

::: info
Type: `string` <br/>
Required: `true`

::: code-group

```typescript [kubb.config.js]
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

### clean

Clean output directory before each build.

::: info
Type: `boolean` <br/>

::: code-group

```typescript [kubb.config.js]
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

### write

Write files to the fileSystem.

::: info
Type: `boolean` <br/>
Default: `true`

::: code-group

```typescript [kubb.config.js]
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

## plugins[]

```typescript
import type { KubbUserPlugin } from '@kubb/core'

type Plugins = Array<KubbUserPlugin | [name: string, options: object]>
```

Array of Kubb plugins to use. The plugin/package can have some extra options defined by the plugin.
Sometimes a plugin is depended on another plugin, if that's the case you will get an error back from the plugin you installed.([see validate](/reference/pluginManager#1-validate))

([see configure](/guide/configure))

When using JSON, the structure will be a little bit different.
Here we are using the same syntax like how [Babel](https://babeljs.io/docs/en/plugins/) makes it possible to use plugins with extra options.

```
[pluginName: string, options: PluginOptions]
```

::: info
::: code-group

```json [kubb.json]
{
  "$schema": "@kubb/core/schemas/config.json",
  "root": ".",
  "input": {
    "path": "./petStore.yaml"
  },
  "output": {
    "path": "./src/gen"
  },
  "plugins": [
    [
      "@kubb/swagger",
      {
        "output": "schemas",
        "validate": true
      }
    ]
  ]
}
```

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    [
      '@kubb/swagger',
      {
        output: 'schemas',
        validate: true,
      },
    ],
  ],
})
```

:::

## hooks[]

Hooks that will be called when a specific action is triggered in Kubb.

### done

Hook that will be triggered at the end of Kubb's generation.<br/>
Useful for running Prettier or ESLint to format/lint your code.

::: info
Type: `string | string[]` <br/>

::: code-group

```typescript [kubb.config.js]
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

```typescript [kubb.config.js]
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
