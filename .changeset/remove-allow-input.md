---
'@kubb/studio': patch
'@kubb/cli': patch
---

Remove `allowInput` from `AgentPermissions` and the `--allow-input`/`KUBB_AGENT_ALLOW_INPUT` flag. Only a sandbox agent can generate from an OpenAPI spec sent by Studio; every other agent always reads its spec from disk, so this was never actually a permission a host could opt into.
