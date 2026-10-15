---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Keep server variables on `InputMeta.servers`. `InputServer` gains an optional `variables` field with the source URL template's variables, copied as-is next to the resolved `url`, so a consumer can tell a templated server from a literal one. It is absent when the server declares no variables.
