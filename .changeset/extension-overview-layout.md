---
'@kubb/adapter-oas': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Give each extension page on kubb.dev the same sections as every other extension (Setup, Options worth knowing, and Example), and fix claims that did not match the code.

- `adapterOas`: without `contentType`, every media type an operation declares is kept. The page also says when the adapter downloads a remote spec or reads files outside the spec's folder.
- `parserTs`: `extension` keys are the extension of the generated file, so `parserTsx` needs its own `.tsx` key.
- `pluginBarrel`: generator plugins write their own barrels by default. Only the root barrel waits for `output.barrel`.
