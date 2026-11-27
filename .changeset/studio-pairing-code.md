---
'@kubb/cli': minor
'@kubb/studio': minor
---

Pair an agent that an MCP client starts with Kubb Studio, with no person approving it. Set `KUBB_STUDIO_PAIRING_CODE` to the one-time code from the `kubb_studio_connect` MCP tool, and `kubb studio connect` redeems it instead of showing a pairing code. The CLI never logs the code.

```shell
KUBB_STUDIO_PAIRING_CODE=kubb_pair_... npx kubb studio connect --allow-write --no-open --url https://kubb.studio
```

`@kubb/studio` adds `redeemPairingCode`, `PairingCodeError`, and `renewAgentToken`, which also returns how long the new token lasts. A token with an expiry refreshes at 70 to 85 percent of its lifetime instead of once a day.
