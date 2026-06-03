---
'@kubb/core': minor
---

Remove the exported `isInputPath` type guard from `@kubb/core`. It had a single internal caller,
where the check is now an inline `'path' in config.input` that narrows the `InputPath | InputData`
union on its own.
