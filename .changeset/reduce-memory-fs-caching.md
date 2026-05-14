---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/agent': minor
---

Reduce peak memory by leaning on the existing `Storage` abstraction.

`BuildOutput.sources`, `Kubb.sources`, and the `kubb:generation:end` hook payload no longer expose an in-memory `Map<string, string>` containing every rendered source string. They now expose a read-through `Storage` view scoped to the files written during the build and backed by `config.storage` (defaults to `fsStorage()`), so generated source bytes are not duplicated in memory.

Read a generated source on demand with the existing `Storage` API:

```ts
const { storage } = await kubb.safeBuild()
const code = await storage.getItem('src/gen/api/getPets.ts')
const paths = await storage.getKeys()
```

`FileManager.dispose()` — clears the per-build FileNode cache. `PluginDriver.dispose()` calls it (and clears `inputNode`) at the end of every build so the parsed adapter graph is released once `kubb:build:end` has fired.

`FileProcessor` now exposes a typed `events` property (`AsyncEventEmitter<FileProcessorEvents>`) with `start`, `update`, and `end` events. The previous `onStart`, `onUpdate`, and `onEnd` callback options have been removed. Subscribe once before calling `run()`:

```ts
fileProcessor.events.on('update', ({ file, source }) => {
  // called for every file written
})
await fileProcessor.run(files, parseOptions)
```

`Kubb.driver` and `Kubb.config` now throw if accessed before `setup()` has been called, instead of returning `undefined`. Both properties are no longer typed as `| undefined`.

Migration:

- `BuildOutput.sources` → `BuildOutput.storage` (type changes from `Map<string, string>` to `Storage`).
- `KubbGenerationEndContext.files` has been removed; use `await storage.getKeys()` to enumerate the generated file paths.
- Listeners of `kubb:generation:end` that previously called `sources.get(path)` synchronously must now `await storage.getItem(path)`.
- The `kubb:generation:end` WebSocket payload (agent) no longer includes `files`; file paths are available as `Object.keys(storage)`.
- `FileProcessor.run()` no longer accepts `onStart`, `onUpdate`, or `onEnd` options; attach listeners via `fileProcessor.events.on(...)` before calling `run()`.
- `Kubb.driver` and `Kubb.config` are now non-optional — accessing them before `setup()` throws `Error('[kubb] setup() must be called before accessing …')`.
