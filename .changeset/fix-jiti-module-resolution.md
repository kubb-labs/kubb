---
"@kubb/cli": patch
---

Fix module resolution issue when loading TypeScript config files. The jiti instance now uses the config file's location as the base for module resolution instead of the CLI's location. This prevents errors like "Cannot find module './_baseIsArguments'" when loading user config files that import Kubb plugins.
