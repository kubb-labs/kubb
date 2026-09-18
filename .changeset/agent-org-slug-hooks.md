---
'@kubb/studio': patch
---

Carry an agent's organization slug through pairing and connecting, so a host can log and trace it
alongside the agent's own slug.

`PairingResult.agent` and the `studio:connected` hook context gain an optional
`organizationSlug`, absent for a sandbox or global agent, which has none. `studio:connected` also
gains `agentSlug`, refreshed on every connect so a rename in Studio shows up without a re-pair.
Both fields are additive: a host built against an older type just ignores them.
