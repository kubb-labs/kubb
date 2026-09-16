---
'@kubb/studio': minor
---

The agent runtime now packs snapshot tarballs itself. A `kubb studio` connection (the CLI or the
Docker agent) accepts a new `studio:snapshot` command: it builds the npm-installable tarball from
a prior generation's files and uploads it directly to the presigned URL Studio provides, instead
of Studio building the tarball on its own server.

`studio:snapshot` packs whatever the session's own most recent `studio:generate` produced, so it
carries no file contents itself, only the package name, version, and upload URL. A snapshot
request with no prior generation on the session is refused. A CI connection (`client.kind: 'ci'`)
also keeps the generated files off `kubb:generation:end` for every generation, not just a
snapshot's, since it has no UI to render them in.

A `kubb studio snapshot` command or the Studio UI's "Create snapshot" button keeps working exactly
as before, now backed by this new protocol message under the hood.
