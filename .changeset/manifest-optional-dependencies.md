---
"@kubb/core": minor
---

Add `optionalDependencies` to `kubb-extension.json`. It lists the extensions a plugin uses when they are in the config, or needs only for some option values, such as `["plugin-faker"]` for `@kubb/plugin-msw` with `parser: 'faker'`.
