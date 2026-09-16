---
'@kubb/studio': minor
---

The agent runtime now packs snapshot tarballs itself. A new `studio:snapshot` command builds the
npm-installable tarball from the session's most recent generation and uploads it directly to the
presigned URL Studio provides, instead of Studio building the tarball on its own server. A
snapshot request with no prior generation is refused.

A CI connection also keeps generated files off every `kubb:generation:end` reply, since it has no
UI to render them in. `kubb studio snapshot` and the Studio UI's "Create snapshot" button keep
working as before, now backed by this protocol message.
