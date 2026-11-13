---
'@kubb/studio': patch
'@kubb/cli': patch
---

`kubb studio` keeps a connected project paired.

- The CLI renews its token once a day while connected.
- Pairing creates a key that stays on the machine.
- `@kubb/studio` adds `refreshAgentToken` and `generateAgentKey`.
