---
'@kubb/core': minor
---

Remove the public `FileProcessor` export from `@kubb/core` and move the `matchFiles` snapshot
helper into `@kubb/core/mocks`. `matchFiles(files, { parsers, format, pre })` takes its parsers and
formatter as options, so it renders generator output to file snapshots without `@kubb/core` pulling
in a parser or prettier.
