---
'@kubb/studio': patch
'@kubb/cli': patch
---

Studio can save the spec it sends as the agent's input, behind the new `--allow-save-input` permission, which is off by default. A pasted document goes to `openapi.yaml` (or `openapi.json`) in the project, and `input` in `kubb.config.ts` points to it, a URL, or a git file. It needs `--allow-config-edit` too. `@kubb/studio/protocol` now exports `ConfigEditOperation`, which names each config edit operation.
