---
"unplugin-kubb": minor
---

Add a `virtual` option that serves generated code as in-memory `kubb:` modules with hot reload.

With `virtual: true`, generation runs into memory instead of writing files to disk, so the output directory stays empty and the source tree keeps no generated code. Import the root barrel from `kubb`, or a single file with `kubb:<path>` relative to the output path. Editing the input spec triggers a Vite HMR update for the modules that changed, with no page reload. Other bundlers still resolve the virtual modules but do not hot-reload them.

```ts
import kubb from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    kubb({
      virtual: true,
      config: {
        input: { path: './petstore.yaml' },
        output: { path: './gen' },
      },
    }),
  ],
})
```

Because nothing is written to disk, the modules are typed loosely as `any`. Reference the ambient declarations once so the editor stops flagging the imports:

```ts
/// <reference types="unplugin-kubb/virtual" />
```
