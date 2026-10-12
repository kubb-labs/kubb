---
'@kubb/adapter-oas': patch
'@kubb/parser-ts': patch
'@kubb/parser-md': patch
'@kubb/plugin-barrel': patch
---

Ship a `kubb-extension.json` manifest and an `OVERVIEW.md` with each package. Studio and the kubb.dev registry read the name, description, icon, and options from the manifest. Each extension's `meta.compatibility` now comes from it.
