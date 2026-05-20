---
"@kubb/core": patch
---

Re-enable npm provenance for published packages. Restores `NPM_CONFIG_PROVENANCE: true` and the `id-token: write` permission in the release workflow so subsequent v4 releases are published with provenance attestations again.
