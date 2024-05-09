---
layout: doc

title: Config
outline: deep
---

# Options

This page is a reference to the different options you can use for configuring your Kubb config.
By setting the following options you can override the default behavior of Kubb and even extend it with your plugins.

::: info INDEX

[name](/config/name)
<br/>
[root](/config/root)
<br/>
[input.path](/config/input#input-path)
<br/>
[input.data](/config/input#input-data)
<br/>
[output.path](/config/output#output-path)
<br/>
[output.clean](/config/output#output-clean)
<br/>
[output.write](/config/output#output-write)
<br/>
[plugins](/config/plugins)
<br/>
[hooks.done](/config/hooks#hooks-done)

:::

::: code-group

```typescript twoslash [kubb.config.ts]
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
