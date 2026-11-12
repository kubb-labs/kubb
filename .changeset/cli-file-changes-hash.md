---
'@kubb/cli': patch
---

Make the "File changes" summary faster on a rerun with `output.clean`: hashing each line of the old output no longer splits it into characters, and a regenerated file with a different length skips the SHA-1 check. The summary is the same.
