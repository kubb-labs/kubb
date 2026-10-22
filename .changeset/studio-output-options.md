---
'@kubb/studio': minor
---

Studio can read and edit the root `output` options of a config entry: `barrel`, `format`, `lint`, and `clean`.

- The connect payload reports them as `outputOptions` on each entry, and the config file view as `output`.
- A generation takes `output` overrides.
- Two new config edits, `set-output` and `remove-output`, write inside `output` in `kubb.config.ts`.
- `output.path` and `output.postGenerate` stay with the config file. The agent never sends the commands to Studio, ignores them in overrides, and refuses edits to either one.
