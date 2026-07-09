---
"@kubb/core": major
"@kubb/cli": major
---

Replace the top-level `hooks` option with `output.postGenerate`.

The post-generate command runner moved from `hooks.done` to `output.postGenerate`, next to `output.format` and `output.lint`. It now takes a labeled array, so each step can carry a `name` that shows in the CLI output. Pass a command string, or `{ name, command }`.

```ts
output: {
  path: './src/gen',
  postGenerate: [{ name: 'types', command: 'npm run typecheck' }, 'biome check --write ./src/gen'],
}
```

The top-level `hooks` option is removed. Move any `hooks.done` commands to `output.postGenerate`. The related diagnostic code is renamed from `KUBB_HOOK_FAILED` to `KUBB_POST_GENERATE_FAILED`.
