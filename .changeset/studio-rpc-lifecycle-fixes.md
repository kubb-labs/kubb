---
'@kubb/studio': patch
---

Fix generation and heartbeat lifecycle bugs left over from the Cap'n Web RPC cutover:

- A dropped Studio connection now cancels the in-flight generation instead of letting it finish
  unwatched.
- Two `startGeneration` calls arriving in the same tick can no longer both start a run.
- A heartbeat ping that never settles (a half-open socket) now closes the session instead of
  hanging it indefinitely.
- Removed an unreachable error path left over from the old JSON transport.
