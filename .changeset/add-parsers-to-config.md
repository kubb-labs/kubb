---
'@kubb/cli': minor
'@kubb/studio': minor
---

`kubb add` now writes a parser into `kubb.config.ts`, as it does for a plugin. A config without `parsers` gets the default parsers next to it (`parserTs()`, `parserTsx()`, `parserMd()`), and `@kubb/parser-ts` and `@kubb/parser-md` are installed at the project's `kubb` version so the config can import them. The `add-plugin` config edit takes `kind: 'parser'` for this. An adapter is still printed as a snippet, since a config has one.

`kubb update <id>` now exits with code 1 when a named id matches no installed extension, so a caller such as Studio no longer reads it as a successful update.
