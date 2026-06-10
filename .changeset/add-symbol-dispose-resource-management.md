---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/mcp': patch
---

Add `Symbol.dispose` support and fix resource cleanup.

`FileManager` and `PluginDriver` now implement `[Symbol.dispose]()`, making them compatible with TypeScript's `using` declaration. `safeBuild()` internally uses `using` instead of a `try/finally` block to guarantee `SetupResult` teardown on all exit paths.

Three resource leaks are also fixed. In watch mode the chokidar watcher is now closed on `SIGINT`/`SIGTERM`, so the process no longer hangs after Ctrl-C. The Studio WebSocket `message` listener is removed in `cleanup()` alongside the other listeners. The MCP HTTP server now closes gracefully on `SIGINT`/`SIGTERM`.

No API changes. Existing `dispose()` calls keep working unchanged.
