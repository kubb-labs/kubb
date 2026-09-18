---
'@kubb/studio': minor
---

Carry an agent's organization slug through pairing and connecting, so a host can log it next to
the agent's own slug.

`PairingResult.agent` gains an optional `organizationSlug`, and the `studio:connected` hook
context gains `agentSlug` and `organizationSlug`, refreshed on every connect. Both are additive:
a host built against an older type ignores them. A sandbox or global agent has no organization,
so its `organizationSlug` is absent.
