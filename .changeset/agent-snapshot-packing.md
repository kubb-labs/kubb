---
'@kubb/studio': minor
---

The agent runtime now packs snapshot tarballs itself. A `kubb studio` connection (the CLI or the
Docker agent) accepts a new `studio:snapshot` command: it builds the npm-installable tarball from
a prior generation's files and uploads it directly to the presigned URL Studio provides, instead
of Studio building the tarball on its own server.

This is additive: existing `studio:generate`/`studio:save` behavior is unchanged, and nothing in
this package's public API changed. A `kubb studio snapshot` command or the Studio UI's "Create
snapshot" button keeps working exactly as before, now backed by this new protocol message under
the hood.
