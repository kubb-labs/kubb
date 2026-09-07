---
'@kubb/cli': patch
---

Fix `kubb studio` to check for a `kubb.config.ts` before pairing with Studio, instead of after. A
project with no config now fails fast instead of starting a device-authorization flow it can
never use.
