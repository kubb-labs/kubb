---
'@kubb/cli': minor
---

`kubb studio` gains `--allowConfigEdit`, letting Studio change plugin options in your
`kubb.config.ts`. The CLI asks for it once per project, the same as the other permissions, and
leaves it off in CI.

It is separate from `--allowWrite`, which covers generated output. Editing the config changes a
file you wrote by hand, so it is granted on its own.
