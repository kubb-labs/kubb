---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Fix extension docs and registry descriptions that did not match the code, and give each extension page on kubb.dev the same sections: Setup, Options worth knowing, and Example.

- `adapterOas`: without `contentType`, Kubb keeps every media type an operation declares. `integerType` applies only to `int64` and `uint64` schemas. The page also says when the adapter downloads a remote spec or reads files outside the spec's folder.
- `parserTs`: each `extension` key is the extension of the generated file, so `parserTsx` needs its own `.tsx` key.
- `parserMd`: the frontmatter example no longer adds a second `# API Reference` H1.
- `pluginBarrel`: generator plugins write their own barrels, and the root barrel is written only when `output.barrel` is set. `pluginBarrel()` takes no arguments, and the README no longer shows `type: 'named'` or `'propagate'`.
