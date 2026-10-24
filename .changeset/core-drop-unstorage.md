---
'@kubb/core': patch
---

Drop `unstorage` and `lru-cache` from `@kubb/core`, which makes `npm i kubb` about 6 MB smaller. `kubbStorage` now writes its files with `node:fs`, in the same folders and format, so stored Studio credentials and reports still load.

`kubbStorage` now returns an object with only `getItem`, `setItem` and `removeItem` instead of an unstorage `Storage`. If your code calls other unstorage methods on it, such as `getKeys`, use `node:fs` with `resolveKubbDir` instead.
