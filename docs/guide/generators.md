---
layout: doc

title: Kubb Custom Generators - Extend Code Generation
description: Create custom generators in Kubb with defineGenerator. Extend code generation with custom templates and renderer output.
outline: deep
---

# Generators

Generators let you extend a plugin's output with your own files. In v5, define custom generators with `defineGenerator(...)` and attach them to a plugin that already works with your chosen adapter.

To add extra code after a generated client with [`@kubb/plugin-client`](/plugins/plugin-client#generators), you can either use the [`footer`](/plugins/plugin-client/#output-footer) option or override the default generator list.

> [!TIP]
> Every plugin exposes a `generators` option. Pair that plugin with `adapterOas()` when you are generating from an OpenAPI document.

## `defineGenerator`

Use `defineGenerator` for both string-based and JSX-based generators. Add a `renderer` only when you want to return JSX output.

```ts
import { defineGenerator } from '@kubb/core'

export const myGenerator = defineGenerator({
  name: 'my-generator',
})
```

## Operation generator example

The following example creates one file per operation and writes the method and URL.

```tsx
import { ast, defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  async operation(node, ctx) {
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    return [
      ast.createFile({
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        sources: [
          ast.createSource({
            nodes: [
              ast.createText(`export const ${node.operationId} = {
  method: '${node.method}',
  url: '${toURL(node.path)}'
}`),
            ],
          }),
        ],
      }),
    ]
  },
})
```

Use the generator from `kubb.config.ts`:

```ts
import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { defineConfig } from 'kubb'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  adapter: adapterOas({ validate: false }),
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginClient({
      generators: [clientOperationGenerator],
    }),
  ],
})
```

## JSX generator example

Use `jsxRenderer` when you want to return JSX instead of raw AST/text nodes.

```tsx
import { defineGenerator } from '@kubb/core'
import type { PluginClient } from '@kubb/plugin-client'
import { File, jsxRenderer } from '@kubb/renderer-jsx'

const toURL = (path: string) => path.replaceAll('{', ':').replaceAll('}', '')

export const clientOperationReactGenerator = defineGenerator<PluginClient>({
  name: 'client-operation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { resolver, root } = ctx
    const { output } = ctx.options
    const file = resolver.resolveFile({ name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Source>
          {`export const ${node.operationId} = {
  method: '${node.method}',
  url: '${toURL(node.path)}'
}`}
        </File.Source>
      </File>
    )
  },
})
```

More examples can be found in [examples/generators](/examples/generators).
