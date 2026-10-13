---
'@kubb/plugin-barrel': patch
---

Keep the per-plugin barrels of other plugins when a plugin has no `output.path`. A plugin whose output resolves to the output root, such as a third-party plugin without an `output` option, no longer gets a barrel of its own or claims the other plugins' directories. The root barrel still re-exports its files.
