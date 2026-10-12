---
'@kubb/cli': patch
---

Add `kubb add`, `kubb update`, and `kubb list` to install and update extensions from the Kubb registry.

- `kubb add <id>` installs a plugin, adapter, or parser at the version the registry pins, after checking that it supports your Kubb and Node.js versions. A plugin is added to `kubb.config.ts`. For an adapter or parser, it prints the code to add. Pass `--yes` to skip the confirmation and `--no-install` to skip the install.
- `kubb update [id...]` moves installed extensions to the pinned version. Pass `--check` to only list the updates.
- `kubb list` shows the installed extensions, their versions, and whether an update exists.

Set `KUBB_REGISTRY` to use another registry than `https://kubb.dev/registry`.
