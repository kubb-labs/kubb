---
'@kubb/cli': patch
---

Fix `RangeError` in IDE-embedded terminals.

The CLI crashed in terminals where `process.stdout.isTTY === true` but `process.stdout.columns === 0` (e.g. JetBrains, VS Code integrated terminal). `canUseTTY()` now requires a positive column count.
