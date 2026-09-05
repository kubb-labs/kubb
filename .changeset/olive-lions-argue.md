---
'@kubb/studio': minor
---

`createClient` now takes its permissions as one object instead of four loose flags:
`permissions: { allowWrite, allowConfigEdit, allowInput, allowExec }`. The keys are unchanged, so a
host moves its existing flags into the object. The new `AgentPermissions` type is exported from
`@kubb/studio/protocol`, which is the same shape the agent sends on connect.
