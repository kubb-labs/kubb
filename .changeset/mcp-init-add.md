---
'@kubb/mcp': patch
---

Find the config the way `kubb generate` does and hand plugin installs to `kubb add`.

- `generate` searches `.kubbrc`, `kubb.config.*`, `.config/`, `configs/` and parent folders, and replies with errors, warnings and diagnostics only.
- `init` no longer takes `plugins`; it tells the agent to run `kubb add <id> --yes`.
