---
'@kubb/cli': patch
---

`kubb generate` now ends with each plugin's file count and time, the slowest plugin flagged, how many files were written and how many were unchanged, the output path, and a hint to try `--watch`. A diagnostic that points into a local spec shows its `file:line:column`, and in a terminal also a code frame with the spot underlined.
