---
"@kubb/adapter-oas": patch
---

Propagate the parent name into object array items so inline enums inside `items` get qualified names (e.g. `AccountLoginsResponseDataStatusEnum`) instead of bare `StatusEnum`. Prevents duplicate identifier collisions when many operations share the same nested property name. Reported in kubb-labs/kubb#3362.
