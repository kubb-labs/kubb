---
'@kubb/studio': patch
---

Remove `memoryBudgetMb` from `AgentCapacity`, along with the `KUBB_AGENT_MEMORY_BUDGET_MB` environment variable. An agent no longer refuses a job for memory, and its heartbeat always reports `accepting: true`.
