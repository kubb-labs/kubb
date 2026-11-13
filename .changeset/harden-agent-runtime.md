---
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/studio': patch
---

Harden the Studio agent runtime.

- A Studio agent only reads a local `$ref` file inside the project. Before, `../../home/kubb/.kubb/cache/studio-credentials` in a saved spec read the agent's token. The new `allowFileRefs` permission (`kubb studio --allow-file-refs`) lifts that limit on a project agent. A sandbox or managed agent reads no local `$ref` file at all, except inside the git checkout of a git input.
- `createKubb` takes a `fileRefs` option, the folders a `$ref` may read from, that an adapter receives in `parse`. `kubb generate` does not set it, so it reads `$ref` files as before.
- A URL input reads no local file from a `$ref`. A refused `$ref` fails with `KUBB_REF_NOT_FOUND`.
- A sandbox agent only fetches a URL `$ref` from a public address, as a managed agent already did. Before, a spec could make the shared host fetch from its internal network.
- `connect({ sandbox: true })` from Studio no longer turns on `allowRead` and `allowReadAst`. Only the host's new `sandbox` option of `connectAgent` does.
- A managed agent checks out its config's git input on public addresses only, as it already did for a git input Studio sends.
- Studio can no longer save an `input` that is a file outside the project.
- A config edit from Studio whose `output.path` is absolute or leaves the output folder is refused.
