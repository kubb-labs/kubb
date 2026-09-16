---
'@kubb/studio': minor
---

The agent runtime now packs snapshot tarballs itself. A `kubb studio` connection (the CLI or the
Docker agent) accepts a new `studio:snapshot` command: it builds the npm-installable tarball from
a prior generation's files and uploads it directly to the presigned URL Studio provides, instead
of Studio building the tarball on its own server.

`studio:snapshot` packs whatever the session's own most recent `studio:generate` produced, so it
carries no file contents itself, only the package name, version, and upload URL. `studio:generate`
gains a `skipStorage` flag Studio sets for a generation it only wants packaged, which keeps the
generated files off the `kubb:generation:end` reply and caches them on the session instead. A
snapshot request with no prior generation on the session is refused.

A `kubb studio snapshot` command or the Studio UI's "Create snapshot" button keeps working exactly
as before, now backed by this new protocol message under the hood.
