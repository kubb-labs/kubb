---
'@kubb/cli': patch
---

Rework the terminal output of every command.

- `kubb generate` opens with the Kubb mascot in Kubb orange, then shows live progress: the parsed spec's schema and operation counts, a bar and one row per plugin while the spec is walked, each file as it is written, and the command each hook runs. The summary leads with the outcome and duration and counts added, modified, deleted and unchanged files. A diagnostic that points into a local spec shows `file:line:column` and a code frame.
- `kubb generate --dry-run` shows a bar of what it would change on disk and lists the changes with line counts. `kubb generate --watch` says what each rebuild changed in the spec, and `r` rebuilds and `q` quits in a terminal. The update check and config load run while the banner plays.
- `kubb add` searches the registry in memory, shows the packages, required plugins and config lines before asking, offers to add missing plugins, and suggests the closest ids for an unknown one. `kubb update` shows each version change with its bump, leaves majors unselected, asks before regenerating, and `--dry-run` replaces `--check` (kept with a deprecation warning). `kubb init` finds the specs in the repo, previews `kubb.config.ts` before writing it, adds a `generate` script and runs the first generation; `--plugins` takes short names such as `ts,zod`. The package manager's output stays off the terminal while these commands install.
- `kubb studio` pairing shows a code with a live countdown and copies it to the clipboard, asks the permissions once in one list, logs each job on one line with who requested it, and `b` moves the session to the background. Ctrl+C disconnects cleanly. `kubb studio status` prints one table with the command that changes each row, and `kubb studio snapshot` prints one line per step plus a short summary with the snapshot number and `View` link.
- Only the long-running or interactive commands draw the mascot; `--yes`, `--dry-run`, quick commands and JSON output print none. Help descriptions are shorter.
