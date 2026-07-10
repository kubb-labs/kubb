---
'@kubb/core': patch
---

Collect reporter results in an ordered array and only buffer them when a `drain` exists.

A reporter whose `report` returned `void` (the default) or any repeated value collapsed to one entry in the backing `Set`, so `drain` received a single item for a run that generated several configs. Reporters without a `drain` also kept every result in memory for the life of the run. Results now keep their order and count, and a reporter with no `drain` buffers nothing.
