---
'@kubb/cli': patch
'@kubb/core': patch
---

Pass the full CLI options to user-defined config functions.

`defineConfig(({ watch, logLevel, config }) => ...)` now actually receives `watch`, `logLevel`, and `config` at runtime. Previously the CLI runner cast `{ input }` to `CLIOptions`, so the other fields were silently `undefined` even though the type promised otherwise.

`CLIOptions.input` is now a documented field (so the cast disappears) and `CLIOptions.logLevel` adds the missing `'verbose'` value to match the CLI's `--logLevel` flag.

```ts
// Now works as expected
export default defineConfig(({ watch }) => ({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen', clean: !watch },
}))
```
