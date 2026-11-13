---
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/studio': patch
---

Harden the Kubb Studio agent against specs it does not control.

- On a Studio agent, a `$ref` only reads local files inside the project. On a sandbox or managed agent it reads none, except inside the checkout of a git input. `kubb studio --allow-file-refs` lifts the project limit, and `kubb generate` is unchanged.
- A URL input no longer reads local files through a `$ref`.
- A sandbox agent only fetches a URL `$ref` from public addresses, and a managed agent only checks out a git input from them.
- Only the host's new `sandbox` option of `connectAgent` lets Studio read a sandbox's output. Studio's own flag no longer does.
- Studio can no longer save an `input` outside the project, or an `output.path` outside the output folder.
- `createKubb` and an adapter's `parse` take `fileRefs`, the folders a `$ref` may read from.
