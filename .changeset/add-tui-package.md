---
"@kubb/tui": minor
"@kubb/cli": minor
---

Add `@kubb/tui`, an opt-in full-screen terminal dashboard for `kubb generate`. Pass `--tui` (or set `KUBB_TUI=1`) to swap clack's scrolling output for a live opentui layout: a status header with elapsed time, a per-plugin progress list, a file-write progress bar, and a scrollable log pane. The TUI runs on Bun with a TTY; on Node, in CI, or when `@kubb/tui` isn't installed, the CLI silently falls back to the existing clack output.
