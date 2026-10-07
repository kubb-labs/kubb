---
'@kubb/studio': patch
---

Lower the memory the `kubb studio` agent uses while idle. `tsdown` and `magicast` now load only when Studio packs a snapshot or reads or edits `kubb.config.ts`. The agent also drops its reference to a finished generation's output, which held every generated file in memory when `allowWrite` was off.
