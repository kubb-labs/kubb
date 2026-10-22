---
'@kubb/studio': minor
---

Studio can read and edit the root `output` options of a config entry: `barrel`, `format`, `lint`, `clean`, and `defaultBanner`. The agent checks each value against the type the option takes.

- The connect payload reports them as `outputOptions` on each entry, and the config file view as `output`.
- A generation takes `output` overrides.
- Two new config edits, `set-output` and `remove-output`, write inside `output` in `kubb.config.ts`.
- Every other `output` member, `path` and `postGenerate` among them, stays with the config file. The agent never sends it to Studio, ignores it in overrides, and refuses edits to it.
