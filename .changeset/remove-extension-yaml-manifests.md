---
'@kubb/adapter-oas': patch
'@kubb/parser-ts': patch
'@kubb/parser-md': patch
'@kubb/plugin-barrel': patch
---

Stop shipping `extension.yaml` in the npm packages and drop the `schemas/extension.json` schema. Extension metadata now lives in the platform repo (`kubb-labs/platform`, `apps/kubb.dev/extensions/`) and the options are documented on each extension's kubb.dev page.
