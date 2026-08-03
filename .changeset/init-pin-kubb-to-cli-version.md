---
"@kubb/cli": patch
---

`kubb init` now installs `kubb` at the exact version of the CLI running the wizard instead of resolving the `kubb@beta` dist-tag again. Plugins keep following the dist-tag of that release channel, since they ship from their own repo.
