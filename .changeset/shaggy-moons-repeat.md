---
'@kubb/studio': minor
---

Let Studio change plugin options in a project's `kubb.config.ts`.

A new `write-config` command carries a list of edits (`set`, `remove`, `add-plugin`) that the agent
applies to the file as an AST patch, so only the targeted values are rewritten. Comments,
formatting, and hand-written code around the config keep their own text.

The agent applies an edit only when the host grants `allowConfigEdit`. This is separate from
`allowWrite`, which covers generated output: editing the config changes a file the user wrote by
hand, so it is granted on its own and never in a sandbox.

The `connected` payload gains `configFile`, reporting each plugin call in the file and whether each
of its options is a literal. An option holding a function or a reference is reported as not
literal, and the agent refuses to overwrite it, so Studio can show the control disabled instead of
hiding it. A config shape the patcher does not manage, an array config for one, comes back
`managed: false` with the reason.
