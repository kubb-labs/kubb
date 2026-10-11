---
'@kubb/studio': patch
---

Fix `kubb studio snapshot` failing with `Cannot read properties of undefined (reading 'readItem')` when `kubb.config.ts` does not set `storage`. The snapshot now reads the generated files from the default fs storage.
