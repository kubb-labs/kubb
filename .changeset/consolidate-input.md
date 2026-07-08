---
'@kubb/core': major
'kubb': major
'@kubb/cli': minor
'@kubb/mcp': minor
'@kubb/adapter-oas': patch
---

Consolidate `input.path` and `input.data` into a single `input`.

`input` now takes a string or a parsed object and detects what it was given: a local file path, a URL, inline OpenAPI content (JSON or YAML string), or an already-parsed spec object. The `{ path }` and `{ data }` object forms are gone.

Before:

```ts
export default defineConfig({
  input: { path: './petStore.yaml' },
})
```

After:

```ts
export default defineConfig({
  input: './petStore.yaml',
})
```

A URL such as `'https://example.com/openapi.json'`, an inline spec string, or a parsed object all work in the same field. A string that starts with `{`/`[`, spans multiple lines, or opens with a YAML `openapi:`/`swagger:` key is read as inline content; anything else is treated as a path or URL.

Update any config, and any code that narrowed `config.input` with `'path' in input`, to the string form (`typeof input === 'string'`).
