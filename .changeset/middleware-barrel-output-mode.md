---
'@kubb/middleware-barrel': major
---

Make barrel generation aware of `output.mode`. A plugin with `output.mode: 'file'` gets no per-plugin barrel, since its output is a single file, and the root barrel re-exports that file directly. A plugin with `output.mode: 'group'` writes one file per group, which the per-plugin barrel re-exports like any other flat layout.
