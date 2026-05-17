---
"@kubb/cli": patch
---

Show live progress for formatter, linter, and custom hooks in the CLI.

Previously, hook commands (linting, formatting, and custom `hooks.done`) ran with no visible indication of activity — the CLI showed only a "started" intro and a "completed" outro, with the actual execution blocking silently between them. The clack logger now renders a live `taskLog` per hook that streams the subprocess output while it runs, and finalizes with a duration on success or keeps the log open with the error on failure.
