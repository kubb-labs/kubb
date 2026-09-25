---
'@kubb/studio': patch
---

An agent reports its capacity when it registers (`KUBB_AGENT_MAX_CONCURRENT`, default 1, and `KUBB_AGENT_MEMORY_BUDGET_MB`, or the new `capacity` option), and what it is carrying with every heartbeat: jobs running, resident memory, bytes of kept generations, and whether it is accepting work. With a memory budget set, an agent refuses new generations once its memory passes 1.5 times that budget, and says so in the heartbeat. Without one it behaves as before. Studios that don't read the new fields ignore them.
