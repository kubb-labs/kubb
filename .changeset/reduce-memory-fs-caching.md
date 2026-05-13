---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/agent': minor
---

Reduce peak memory by leaning on the existing `Storage` abstraction.

`BuildOutput.sources`, `Kubb.sources`, and the `kubb:generation:end` hook payload no longer expose an in-memory `Map<string, string>` containing every rendered source string. They now expose a read-through `Storage` view scoped to the files written during the build and backed by `config.storage` (defaults to `fsStorage()`), so generated source bytes are not duplicated in memory.

Read a generated source on demand with the existing `Storage` API:

```ts
const { sources } = await kubb.safeBuild()
const code = await sources.getItem('src/gen/api/getPets.ts')
const paths = await sources.getKeys()
```

Two new helpers support the change:

- `disposeFile(file)` (exported from `@kubb/ast`) — releases the heavy `CodeNode` payload carried inside each `SourceNode` once a `FileNode` has been rendered. The outer `sources` / `imports` / `exports` arrays and their wrapper-node metadata are preserved. `FileProcessor` now calls this after each file is written so the AST graph does not survive the entire build.
- `FileManager.dispose()` — clears the per-build FileNode cache. `PluginDriver.dispose()` calls it (and clears `inputNode`) at the end of every build so the parsed adapter graph is released once `kubb:build:end` has fired.

Migration:

- Listeners of `kubb:generation:end` that previously called `sources.get(path)` synchronously must now `await sources.getItem(path)`.
- Code that read `driver.fileManager.files` after a build returned should read `BuildOutput.files` instead. The returned array is unchanged, but the live FileManager cache is disposed when the build ends.
