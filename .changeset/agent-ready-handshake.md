---
"@kubb/studio": patch
"@kubb/cli": patch
---

Add a `studio:ready` acknowledgement so a host can tell "the socket is open" apart from "Studio has registered this connection and will dispatch jobs to it".

A connected socket announces itself with `agent:connect` but never waited for a reply, so a job could arrive at Studio moments before the agent was actually registered. `StudioSession` now waits up to 10 seconds for `studio:ready` after sending that handshake and fires a new `studio:ready` hook once it lands, warning instead of failing if an older Studio never sends one. `kubb studio` prints `✓ Ready to receive jobs` once it does.
