---
'@kubb/cli': minor
---

`kubb studio` gains `--allowConfigEdit`, which lets Studio change plugin options in your
`kubb.config.ts`. It is asked for once per project like the other permissions, and stays off in CI.

This is separate from `--allowWrite`, which covers generated output: editing the config changes a
file you wrote by hand, so it is granted on its own.
