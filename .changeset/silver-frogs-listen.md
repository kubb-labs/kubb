---
'@kubb/cli': minor
---

`kubb studio` now recovers when Studio rejects the agent token while a session is already live,
not only at startup: it explains what happened, reopens the browser approval flow, and reconnects
with the new token. Saved project permissions carry over when the reauthenticated agent keeps the
same identity and Studio URL, and are asked again when it does not.

An operator-supplied `KUBB_AGENT_TOKEN` is never replaced automatically, and CI or a run without a
browser exits with instructions to run `kubb studio login`. Ctrl+C now cancels an in-flight
pairing cleanly instead of leaving it running.
