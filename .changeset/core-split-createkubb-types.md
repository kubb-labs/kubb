---
'@kubb/core': patch
---

Split the type definitions out of `createKubb.ts` into the `types.ts` barrel and replace the internal `HookRegistry` with inline listener tracking on `KubbDriver`. Also drop the unused `tinyexec` dependency. These are internal cleanups with no change to the public API.
