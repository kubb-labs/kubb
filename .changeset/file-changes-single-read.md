---
'@kubb/cli': patch
'@kubb/core': patch
---

Rerun `kubb generate` with less memory and time: the "File changes" summary no longer reads the whole output folder up front.

- Add `stored` to `kubb:file:processed`: what the storage held at that path before the write, or `null` when there was nothing.
