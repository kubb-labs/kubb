---
'@kubb/core': patch
'@kubb/cli': patch
---

Add `kubbStorage`, an unstorage fs storage for the files Kubb keeps for itself, under `~/.kubb` or a temp folder.

- `kubbStorage({ base })` and `resolveKubbDir(base)` resolve `base` inside `KUBB_HOME` (default `~/.kubb`) and use an absolute path as is. When that folder is not writable, they use a folder in the OS temp directory.
- The folder gets mode 0700, so only its owner can open the files in it.
- The `file` and `html` reporters write to `.kubb` through it. In the log file name, characters in the config name other than letters, digits, `_`, and `-` now become `-`, as the `html` reporter already did.
- `kubb studio` keeps its credential and machine secret in the same files under `~/.kubb/projects`, so nobody pairs again.

```typescript
import { kubbStorage } from '@kubb/core'

const storage = kubbStorage({ base: 'cache' })
await storage.setItem('machine-secret', secret)
```
