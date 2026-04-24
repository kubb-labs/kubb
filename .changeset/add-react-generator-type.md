---
"@kubb/core": minor
---

Add `ReactGenerator` type and `defineReactGenerator` helper.

Generators that produce renderer elements (e.g. JSX from `@kubb/renderer-jsx`) can now be
typed as `ReactGenerator<TOptions, TElement>` instead of the wider `Generator<TOptions, TElement>`.
`ReactGenerator` is a `Generator` that requires a non-null `renderer` field, making it clear
that the generator depends on a renderer to process its output.

`ReactGenerator<TOptions, TElement>` is always assignable to `Generator<TOptions>`, so existing
plugin `generators` options that accept `Array<Generator<PluginTs>>` continue to work when a
`ReactGenerator` is passed alongside plain generators.

New exports:

- `ReactGenerator<TOptions, TElement>` — type for renderer-based generators
- `defineReactGenerator<TOptions, TElement>(gen)` — identity helper (like `defineGenerator`) that
  narrows the return type to `ReactGenerator`

```ts
import { defineReactGenerator } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import type { KubbReactElement } from '@kubb/renderer-jsx'

export const typeGenerator = defineReactGenerator<PluginTs, KubbReactElement>({
  name: 'typescript',
  renderer: jsxRenderer,          // required — ReactGenerator enforces this
  schema(node, ctx) {
    return <File ...><Type node={node} /></File>
  },
})

// Fully type-safe: ReactGenerator is assignable to Generator
pluginTs({
  generators: [typeGenerator, myCustomGenerator],
})
```
