---
'@kubb/studio': patch
'@kubb/cli': patch
---

Align how `kubb studio`, the Docker agent, and `kubb studio snapshot` pair, connect, and log. The runtime no longer prints or knows its host, pairing takes a `type` through the new `pairAgent`, and snapshots report the files changed since the previous one.
