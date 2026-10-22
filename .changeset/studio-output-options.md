---
'@kubb/studio': minor
---

Studio can read and edit the root `output` options of a config entry, such as `barrel`, `format`, `lint`, and `postGenerate`.

- The connect payload reports them as `outputOptions` on each entry, and the config file view as `output`.
- A generation takes `output` overrides. `output.path` is never overridden.
- Two new config edits, `set-output` and `remove-output`, write inside `output` in `kubb.config.ts`. They refuse `output.path`.
- Changing `postGenerate` needs `allowExec`, since the agent runs those commands.
