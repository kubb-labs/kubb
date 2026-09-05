---
'@kubb/cli': minor
---

`kubb studio` reconnects on its own when Studio rejects the agent token while the session is
already live, not only at startup. It explains what happened, reopens the browser approval flow,
and reconnects with the new token, keeping saved project permissions when the reauthenticated
agent has the same identity and Studio URL.

An operator-supplied `KUBB_AGENT_TOKEN` is never replaced automatically: a rejection there tells
the operator to update it. In CI or without a browser, `kubb studio` exits with instructions to run
`kubb studio login`. A newly approved token rejected again immediately is treated as a hard
failure instead of pairing forever.

Ctrl+C now cancels an in-flight pairing or reconnect instead of leaving it running, and no longer
leaves behind a duplicate shutdown handler across a reauth.
