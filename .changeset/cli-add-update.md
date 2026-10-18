---
'@kubb/cli': minor
---

Make `kubb add` and `kubb update` show what they will do before they do it.

- `kubb add` searches the registry in memory and marks installed extensions. Before asking, it shows the plugins the extension needs, the packages it installs, and the exact lines it adds to `kubb.config.ts`. It offers to add missing required plugins, and `--yes` adds them. An unknown id suggests the closest ids.
- `kubb update` shows each version change with its bump and flags majors as breaking. Majors start unselected, also with `--yes`. After the install, it regenerates in the same process and lists the changed files.
- `kubb update --check` exits with code 1 when an update exists.
