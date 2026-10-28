---
'@kubb/core': patch
---

Speed up `output.clean`. Files written into the cleaned output are no longer read back first, and `fsStorage` moves the previous output aside and deletes it in the background while the new files are written.
