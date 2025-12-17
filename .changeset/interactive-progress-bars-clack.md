---
'@kubb/cli': minor
'@kubb/core': minor
---

Replace cli-progress and consola with @clack/prompts for modern interactive progress bars. Introduces flexible logger pattern with Claude-inspired CLI and GitHub Actions support.

**Interactive Progress Bars:**
- Real-time progress bars for plugin execution and file writing
- Block-style indicators for plugin generation with simulated progress
- Heavy-style indicators for file writing with accurate tracking
- Automatic cleanup and completion messages with timing

**defineLogger Pattern:**
- Four loggers: clack (local TTY), githubActions (CI), plain (fallback), fileSystem (debug)
- Environment auto-detection with `getLoggerByEnvironment()`
- Functional factories using `defineLogger` helper
- All loggers return cleanup functions for consistent lifecycle management

**GitHub Actions Integration:**
- Full logger with group management using `::group::` / `::endgroup::` annotations
- Optional `groupId` parameter on all logger events for custom group organization
- Collapsible sections for cleaner CI workflow logs
- Auto-close groups on cleanup

**Event-Based System:**
- 29 documented events covering lifecycle, plugins, file operations, and logging
- Events: `lifecycle:start`, `lifecycle:end`, `plugin:start`, `plugin:end`, `files:processing:*`, etc.
- Hook events: `plugins:hook:progress:*`, `plugins:hook:processing:*`
- Comprehensive JSDoc documentation for all events

**Debug File Persistence:**
- fileSystemLogger captures debug/verbose events to `.kubb/kubb-{timestamp}.log`
- Auto-enabled in debug mode (logLevel >= debug)
- Process exit handlers for crash recovery (best-effort)
- Logs grouped with category labels for easy searching

**Claude Code-Inspired CLI:**
- Task status icons (✓ success, ✗ error, ⚠ warning, ◐ in-progress, ℹ info)
- Contextual error messages with stack traces in debug mode
- Error/warning counters in build summary
- Timestamped verbose logging for operation tracing
- Category-based debug logging with color-coded prefixes

**Error Handling:**
- Try-catch wrappers in hook execution prevent unhandled errors
- Errors properly emitted through event system
- Consistent error handling across all loggers
