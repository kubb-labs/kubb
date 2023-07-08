---
layout: doc

title: Options
outline: deep
---
# Options

This page is a reference to the different options you can use for configuring your Kubb config.
By setting the following options you can override the default behaviour of Kubb and even extend it with your own plugins.

## root
Project root directory. Can be an absolute path, or a path relative from the location of the config file itself.

Type: `string` <br/>
Default: `process.cwd()`

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
  }
})
```

:::

## input
### input.path
Path to be used as the input. Can be an absolute path, or a path relative from the defined root option.

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
  }
})
```

:::

## output
### output.path
Path to be used to export all generated files. Can be an absolute path, or a path relative from the defined root option.

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
  }
})
```

:::

### clean
Remove previous generated files and folders.
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
    clean: true
  },
})
```

:::

### write
Enabled or disable the writing to the filesystem.

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
    write: true
  },
})
```

:::

## plugins
Array of Kubb plugins to use. The plugin/package can have some extra options defined by the plugin.
Sometimes a plugin is depended on another plugin, if that's the case you will get an error back from the plugin you installed.([see validate](/reference/pluginManager#1-validate))

### plugins[index]

#### TypeScript

Type: `Plugin` <br/>

::: code-group

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
  plugins: [createSwagger({ })],
})
```

:::

#### JSON
When using JSON the structure will be a little bit different. 
Here we are using the same syntax like how [Babel](https://babeljs.io/docs/en/plugins/) make it possible to use plugins with extra options.
```
[NAME PLUGIN, {...options}]
```

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
       "validate" :true
      }
    ]
  ]
}
```

:::

## hooks
Hooks that will be called when a specific action is triggered in Kubb.

### done
Hook that will be triggerend at the end of all executions.
Useful for running Prettier or ESLint after all files has been created.

Type: `string | string[]` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  hooks: {
    done: ["npx prettier --write ."]
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
