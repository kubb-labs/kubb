---
"@kubb/tui": minor
"@kubb/cli": minor
"@kubb/core": minor
"kubb": minor
---

Add `@kubb/tui`, an opt-in full-screen terminal dashboard for `kubb generate`. Pass `--tui` (or set `KUBB_TUI=1`) to swap clack's scrolling output for a live opentui layout: a status header with elapsed time, a per-plugin progress list, a file-write progress bar, and a scrollable log pane. The TUI runs on Bun with a TTY; on Node, in CI, or when the renderer can't load, the CLI silently falls back to the existing clack output. `@kubb/tui` ships as a regular dependency of `@kubb/cli` and the `kubb` meta-package so the flag works out of the box. Keybindings: `↑/↓` select a task, `enter` expand the selected task, `r` restart the last generation, `c` clear the log, `?` toggle help, `q` (or `ctrl+c`) quit. `LoggerOptions` in `@kubb/core` gains an optional `onRestart` callback that custom loggers can wire to their own restart affordance.
