---
'@kubb/core': minor
---

Run `output.format`, `output.lint` and `output.postGenerate` from `Kubb.generate()` by default, so every host gets the same passes.

- Adds `runOutputPasses` and `runHook`, the one implementation of the format, lint and post-generate steps. `runHook` spawns the command with `node:child_process`, in the config `root`, and emits `kubb:hook:start`, `kubb:hook:line` and `kubb:hook:end` itself.
- `generate({ processOutput })` still replaces the passes when a host needs to; its context now also carries `hooks` and `signal`.
- `unplugin-kubb` and `kubb mcp` start honoring `output.format`, `output.lint` and `output.postGenerate`, which they ignored before.
