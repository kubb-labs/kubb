---
"@kubb/core": minor
---

Make `adapter` and `input` optional in `Config` and `UserConfig` to support plugin-only mode.

When `adapter` is omitted, Kubb skips the spec parse phase and runs in plugin-only mode:
- `kubb:plugin:setup` fires normally, so `injectFile` works as usual
- Files injected via `injectFile` are written through storage as usual
- `kubb:build:start` is not emitted (no `inputNode`)
- `kubb:generate:schema` / `kubb:generate:operation` are never emitted

This lets scripts use Kubb purely for its file-management layer without a dummy OpenAPI spec.

```ts
// before: a dummy spec was required even for file-injection-only scripts
export default defineConfig({
  input: { path: './dummy.yaml' },
  output: { path: '.' },
  adapter: adapterOas(),
  plugins: [myFilePlugin()],
})

// after: adapter and input can be omitted entirely
export default defineConfig({
  output: { path: '.' },
  plugins: [myFilePlugin()],
})
```

When `adapter` is set but `input` is omitted, a clear runtime error is thrown: `[kubb] input is required when using an adapter`.
