---
'@kubb/studio': major
'@kubb/cli': major
---

Replace the agent WebSocket command protocol with Cap’n Web RPC. Hosts must provide an RPC attach
function, and `StudioSession` now exposes the typed `AgentApi` directly. Legacy command envelopes
and message guards are removed.
