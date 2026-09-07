---
'@kubb/studio': minor
'@kubb/cli': patch
---

New `runConnection` keeps a host connected to Studio across token changes: it opens a client,
waits until the run ends or Studio rejects the token, and reconnects with whatever credential the
host hands back from `onTokenRejected`. Where credentials live, whether a rejected token may be
replaced, and how any of it is reported stay with the host.

`kubb studio` runs on it now instead of keeping its own copy of that loop. Its behavior is
unchanged.
