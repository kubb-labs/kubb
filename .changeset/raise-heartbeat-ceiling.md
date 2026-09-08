---
'@kubb/studio': minor
---

Let a host slow its heartbeat down to 60 seconds. `heartbeatInterval` was clamped to the 30-second
default, so it could only ever be lowered, which made it useful in development and useless for
cutting the traffic and database writes a long-lived agent costs.

`agentDefaults.maxHeartbeatIntervalMs` (60000) is now the ceiling, separate from
`agentDefaults.heartbeatIntervalMs` (30000), which stays the default. Nothing changes unless a host
asks for a slower cadence.

The ceiling is a protocol contract with Studio: Studio drops an agent from the active list once its
stored ping is older than its liveness window, and it stores a ping at most once a minute, so a
slower cadence would make a healthy agent look dead after one missed ping.
