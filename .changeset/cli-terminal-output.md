---
'@kubb/cli': patch
---

Rework the terminal output of every command.

- `kubb generate` opens with the mascot and shows live progress: spec counts, a bar per plugin, each file as it is written, and the hook commands. The summary leads with the outcome and counts added, modified, deleted and unchanged files. Spec diagnostics show `file:line:column` with a code frame.
- `--dry-run` lists what would change on disk. `--watch` says what each rebuild changed; `r` rebuilds, `q` quits.
- `kubb add` previews packages, required plugins and config lines before asking. `kubb update` shows each bump, leaves majors unselected, asks before regenerating; `--dry-run` replaces `--check`. `kubb init` finds specs, previews the config, adds a `generate` script and runs once; `--plugins` takes short names. Installs run quietly.
- `kubb studio` pairs with a code and countdown, asks permissions once, logs each job on one line with its requester, and `b` backgrounds the session. `status` and `snapshot` print one short table.
- Only long-running or interactive commands draw the mascot.
