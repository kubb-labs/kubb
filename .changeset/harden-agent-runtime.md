---
"@kubb/adapter-oas": patch
"@kubb/core": patch
"@kubb/studio": patch
---

Harden the Studio agent runtime.

- A `$ref` may only read local files inside the input's own folder (`root` for inline content), and a URL input reads no local files. Before, `../../home/kubb/.kubb/cache/studio-credentials` in a fetched spec read the agent's token. A refused `$ref` fails with `KUBB_REF_NOT_FOUND`.
- A sandbox or managed agent reads no local file from any `$ref`, through the new `withoutFileRefs` from `@kubb/core`.
- `connect({ sandbox: true })` from Studio no longer turns on `allowRead` and `allowReadAst`. Only the host's new `sandbox` option of `connectAgent` does.
- A managed agent checks out its config's git input on public addresses only, as it already did for a git input Studio sends.
- A config edit from Studio whose `output.path` is absolute or leaves the output folder is refused.
