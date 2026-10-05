---
'@kubb/studio': patch
---

Keep plugin and adapter options from `kubb.config.ts` that can't be sent as JSON, such as `macros`, resolver functions, and `RegExp` patterns, when merging Studio's options for a generate. Before, Studio's lossy copy replaced them, so custom macros stopped running.
