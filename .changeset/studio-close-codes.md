---
'@kubb/studio': patch
---

An agent reads why Studio closed its connection. On `4001` it registers again, then reconnects. On `4002`, another instance of the same agent took over, so it stays down. On `4003`, the agent is too old for Studio or was deleted, so it stops and reports that it needs upgrading or pairing again. Any other close reconnects as before. `AgentCloseCode` and `RpcClose` are exported, and `RpcConnection.closed` now resolves with the close code and reason when the transport has one.
