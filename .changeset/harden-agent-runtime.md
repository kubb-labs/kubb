---
"@kubb/adapter-oas": patch
"@kubb/core": patch
"@kubb/studio": patch
---

Harden the Studio agent runtime.

- A Studio agent only reads a local `$ref` file inside the input's folder or the project. Before, `../../home/kubb/.kubb/cache/studio-credentials` in a saved spec read the agent's token. A sandbox or managed agent reads no local `$ref` file at all. Both go through the new `withFileRefs` from `@kubb/core`, and `kubb generate` reads `$ref` files as before.
- A URL input reads no local file from a `$ref`. A refused `$ref` fails with `KUBB_REF_NOT_FOUND`.
- `connect({ sandbox: true })` from Studio no longer turns on `allowRead` and `allowReadAst`. Only the host's new `sandbox` option of `connectAgent` does.
- A managed agent checks out its config's git input on public addresses only, as it already did for a git input Studio sends.
- A config edit from Studio whose `output.path` is absolute or leaves the output folder is refused.
