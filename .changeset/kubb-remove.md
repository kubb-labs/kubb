---
'@kubb/cli': minor
'@kubb/studio': minor
---

Add `kubb remove <id>`, which deletes a plugin or parser from `kubb.config.ts`, with the imports nothing else uses, and uninstalls its package. Pass `--no-uninstall` to keep the package. It refuses the adapter, the last parser, and an extension another one in the config depends on.

Studio can run it through the agent's new `removeExtension` call, which needs the new `--allow-remove` permission (asked once per project) and `--allow-config-edit`. The `remove-extension` config edit does the config change.
