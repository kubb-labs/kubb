---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/studio': patch
---

`input` reads a spec from a git repository. Write it as `git+<repo>#<ref>:<path>`, where `<ref>` is an optional branch, tag, or full commit SHA. Kubb runs a shallow `git fetch` into a temporary folder, so any host works, a private repository uses your git credentials, and relative `$ref` files resolve. `kubb validate` accepts the same form.

```ts
export default defineConfig({
  input: 'git+https://github.com/org/api.git#v2:specs/openapi.yaml',
})
```

A failed fetch reports `KUBB_GIT_INPUT_FAILED`.
