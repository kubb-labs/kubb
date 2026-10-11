---
'@kubb/studio': patch
---

Send Kubb Studio a JSON copy of each plugin's options, so functions in `kubb.config.ts` never reach Studio as something it can call.

- Report a plugin defined in the project by its own `name` instead of a `@kubb/plugin-*` package that does not exist.
- Keep such a plugin when Studio sends its options back unchanged, and explain that its options can only change in the config file otherwise.
