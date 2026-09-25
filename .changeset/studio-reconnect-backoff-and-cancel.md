---
'@kubb/studio': patch
---

An agent's reconnect now backs off with full jitter (doubling from a 1s floor up to `retryInterval`) instead of retrying at a fixed interval, so many agents reconnecting after the same Studio outage land at different moments instead of in lockstep.

`AgentApi` gains `cancel(jobId)`, reaching the running job by id instead of only through the `GenerationRun` object `startGeneration` returned — useful for a caller (Studio, after its own restart) that re-attaches to a job by id without holding that reference.
