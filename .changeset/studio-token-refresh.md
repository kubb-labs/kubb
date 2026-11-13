---
'@kubb/studio': minor
'@kubb/cli': minor
---

Add `refreshAgentToken` to `@kubb/studio`, which trades an agent's token for a new one through Studio's refresh endpoint, and accept a function as the `token` of `connectAgent` so a reconnect uses the refreshed token. `kubb studio` now refreshes a token older than a day when it connects and once a day while it runs, and tries one refresh before it asks to pair again.
