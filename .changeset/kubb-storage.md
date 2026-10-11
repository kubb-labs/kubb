---
'@kubb/core': patch
'@kubb/cli': patch
---

Add `kubbStorage`, an unstorage fs storage for the files Kubb keeps for itself under `~/.kubb`, with a temp folder as fallback.

- Use `kubbStorage({ base })` or `resolveKubbDir(base)` to resolve `base` inside `KUBB_HOME` (default `~/.kubb`). An absolute `base` is used as is, and a folder that is not writable falls back to the OS temp directory.
- Keep the files private: the folder gets mode 0700.
- Write `file` and `html` reports to `.kubb` through it.
- Name log files after the config with every character other than letters, digits, `_`, and `-` replaced by `-`, as the `html` reporter already did.
- Keep existing pairings: `kubb studio` reads its credential and machine secret from the same files under `~/.kubb/projects`.

```typescript
import { kubbStorage } from '@kubb/core'

const storage = kubbStorage({ base: 'cache' })
await storage.setItem('last-run.json', { at: Date.now() })
```
