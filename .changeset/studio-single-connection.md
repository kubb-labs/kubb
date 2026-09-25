---
'@kubb/studio': major
---

An agent process keeps one WebSocket instead of one per `poolSize` slot. `registerAgent` (`POST /api/agent/connect`) sends the machine token, a process `instanceId`, and its capacity, and returns the socket's URL; the old `poolSize` option, `createAgentSession`, `disconnect`, and the `/api/agent/sessions` endpoints are gone. The socket carries the bearer token and a new `x-kubb-instance-id` header. Every connection attempt registers first, so a reconnect is also how the agent registers again — including after a `4001` close.

A `426` at registration throws the new `IncompatibleAgentError` instead of retrying: the agent is too old for that Studio.

This needs a Studio that speaks the new protocol (kubb-platform ADR-0003, stage C). It ships as a prerelease until that Studio deploys.

Runtime concurrency is still one job at a time: a `capacity.maxConcurrent` above that is clamped and warned about, since a second concurrent run would share this session's plugin config and hook emitter until per-job workers land (ADR-0003 slice B2).
