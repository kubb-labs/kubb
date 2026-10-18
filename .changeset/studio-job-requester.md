---
'@kubb/studio': minor
'@kubb/cli': minor
---

Show who asked for each Studio job. `GenerateInput` and `SaveConfigInput` take an optional `requestedBy` name, and `studio:command` carries it, with `failed` set for a failed generation. In a terminal, `kubb studio connect` now logs each job on one line, such as `14:05:02  generate  by Stijn  ✓ 72 files in 450ms`, with a long name cut to 12 characters, instead of the full generate output.
