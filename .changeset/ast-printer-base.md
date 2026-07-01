---
"@kubb/ast": minor
---

Let a printer node override reuse the handler it replaces. A printer builder can now pass user handlers through the new `overrides` field instead of spreading them into `nodes`, and an override can call `this.base(node)` to get the built-in output and wrap it:

```ts
pluginZod({
  printer: {
    nodes: {
      object(node) {
        return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
      },
    },
  },
})
```
