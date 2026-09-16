---
'@kubb/studio': minor
'@kubb/cli': minor
---

Stop streaming generated source over the agent WebSocket by default. Reading it now needs
`--allow-read` (or `KUBB_AGENT_ALLOW_READ=true`), matching the other four Studio permissions.

Every `kubb studio` session used to send the full text of every generated file on
`kubb:generation:end`, whether or not anyone in the browser opened one. A spec producing hundreds
of files could put megabytes of source on the wire per run, and nothing gated it: `allowWrite`,
`allowConfigEdit`, `allowInput`, and `allowExec` all cover what Studio may do _to_ a project, but
reading generated output back was never one of the four.

`kubb:generation:end` now carries nothing. Everything it used to carry moved somewhere better:

- The list of generated files is on `kubb:build:end`, which already carried every path and fires
  earlier in a run. Its paths are now relative to the agent's root, matching every other path on
  the wire, where they used to be absolute.
- The file count is on `kubb:generation:summary`, which already had it and was always the accurate
  number (`kubb:generation:end`'s old count went to 0 for a CI connection).
- File contents are fetched on demand with a new `studio:files` command, which the browser sends
  when someone opens a file. The agent replies with `agent:files`, refusing unless `allowRead` was
  granted.
- Peer dependency metadata, previously sent on every generation and round-tripped straight back
  into `studio:snapshot`, now travels with the `agent:snapshot` reply instead, since the CI
  snapshot flow is its only consumer. `studio:snapshot` takes `bundledDependencies` in place of
  `peerDependencies`.

`--allow-read` is off by default everywhere, like every other permission. A sandbox or global
agent is always granted it, since its output is the only thing it has:

```shell
kubb studio --allow-read   # show generated files in the browser
```

An older Studio instance talking to this version of the agent (or the reverse) will not error: it
will show an empty editor with no file contents, since the shapes on both ends changed. Point
`--url` at a Studio build that matches this version.

The in-process `kubb:generation:end` hook (`kubb.hooks.hook('kubb:generation:end', ...)`, or a
plugin's own listener) is unaffected. It still carries `config`, `storage`, `diagnostics`,
`status`, `hrStart`, and `filesCreated`, exactly as before. Only the payload this event sends over
the Studio WebSocket changed.
