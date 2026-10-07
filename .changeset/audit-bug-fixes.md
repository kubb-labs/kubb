---
'@kubb/adapter-oas': patch
'@kubb/cli': patch
'@kubb/mcp': patch
'@kubb/studio': patch
'@kubb/renderer-jsx': patch
---

Fix a batch of small bugs:

- `@kubb/adapter-oas`: resolve local `$ref` pointers per RFC 6901, so `#/paths/~1pets/get` and keys with `~` or an encoded `/` resolve. On Windows, an absolute input such as `C:\specs\api.yaml` no longer counts as a URL, so a missing file now reports `KUBB_INPUT_NOT_FOUND` instead of failing later.
- `@kubb/mcp`: reload `kubb.config.ts` on every tool call. The server cached the first load, so edits only showed up after a restart.
- `@kubb/cli`: `CI=false` and `CI=0` no longer count as running in CI, and `kubb init` detects Bun from `bun.lock` as well as `bun.lockb`.
- `@kubb/studio`: a failing format, lint or `postGenerate` command reports one `kubb:error` instead of two.
- `@kubb/renderer-jsx`: fix the `meta` prop type on `<kubb-file>`, which referenced `FileNode` without importing it.
