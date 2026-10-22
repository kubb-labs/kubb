---
'@kubb/studio': patch
'@kubb/cli': patch
---

Studio can install and update registry extensions through the agent, behind the new `--allow-install` and `--allow-update` permissions. `kubb add` exits with code 1 when it cannot write the plugin into `kubb.config.ts`, and `kubb update --yes` installs a major when you name it.
