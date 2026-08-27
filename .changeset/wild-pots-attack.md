---
'@kubb/studio': minor
'@kubb/cli': minor
---

Add `@kubb/studio`, the client runtime that connects a Kubb project to Kubb Studio, and a
`kubb studio` command that uses it.

`kubb studio` pairs a machine by showing a code you approve in the browser (an RFC 8628 device
authorization grant), then streams generation events over the same WebSocket relay the Docker
agent uses. It runs against the project's own config and its own installed plugins, so no
container and no pinned plugin set are involved.

Everything is read-only by default: `--allow-write` writes generated files, `--allow-input`
accepts a spec from Studio, and `--allow-exec` runs the formatter, the linter, and
`output.postGenerate`. Studio can only configure plugins the local config already imports.

`kubb studio login`, `kubb studio logout`, and `kubb studio status` manage the pairing.
