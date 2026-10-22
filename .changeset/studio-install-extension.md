---
'@kubb/studio': minor
'@kubb/cli': minor
---

Add the `allowInstall` permission and the `installExtension` RPC, so Studio can install an extension from the registry into the project. The agent runs `kubb add <id> --yes`, which also adds a plugin to `kubb.config.ts`. `kubb studio` asks for it once per project, or takes `--allow-install`. `kubb add` now exits with code 1 when it installed a plugin but could not write it into `kubb.config.ts`.
