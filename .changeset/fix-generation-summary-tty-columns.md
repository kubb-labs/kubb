---
"@kubb/cli": patch
---

Fixed `Error in async listener for "generation:summary"` that occurred in IDE-embedded terminals (e.g. JetBrains, VS Code integrated terminal) where `process.stdout.isTTY === true` but `process.stdout.columns === 0`. The clack interactive renderer was selected for these environments and called `String.prototype.repeat()` with a negative count when computing box widths, throwing a `RangeError`. `canUseTTY()` now requires a positive column count, and `clack.box()` calls have a plain-text fallback in case rendering still fails.
