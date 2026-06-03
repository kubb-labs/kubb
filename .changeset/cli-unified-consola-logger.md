---
'@kubb/cli': minor
---

Collapse the `clack` / `github-actions` / `plain` CLI loggers into a single [consola](https://github.com/unjs/consola)-backed logger. One set of `KubbHooks` handlers now covers every environment, with an optional decorator that mirrors warnings, errors, notices, and section boundaries as GitHub Actions workflow commands (`::group::`, `::warning::`, `::error::`, `::notice::`) when the runner is detected.

The reporters (`cli`, `json`, `file`) are unchanged. CLI output stays familiar — colored on TTY, plain in CI, annotated under GitHub Actions — but the in-place spinners, progress bars, and per-hook task logs that came from `@clack/prompts` are replaced by consola's line-based output. Hook subprocess output now streams through `consola.log` rather than into a collapsible block.
