---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/agent': patch
'@kubb/mcp': patch
---

Add `Symbol.dispose` support and fix resource cleanup.

`FileManager` and `PluginDriver` now implement `[Symbol.dispose]()`, making them compatible with TypeScript's `using` declaration. `safeBuild()` internally uses `using` instead of a `try/finally` block to guarantee `SetupResult` teardown on all exit paths.

Three genuine resource leaks are also fixed:

- **Watch mode**: the chokidar watcher is now closed on `SIGINT`/`SIGTERM` (previously the process would hang after Ctrl-C)
- **Studio WebSocket**: the `message` event listener is now removed in `cleanup()` alongside the other listeners
- **MCP HTTP server**: `SIGINT`/`SIGTERM` now trigger a graceful `server.close()`

No API changes — all existing `dispose()` calls continue to work unchanged.
