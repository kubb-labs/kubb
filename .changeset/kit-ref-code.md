---
'@kubb/kit': patch
---

Add the `ref(plugin?, options?)` composable and the `code` template. `ref` wraps a plugin's resolver, so each resolver method that returns a name now returns the name plus its import from that plugin's file. A schema name that is not in the document, or a node the plugin excludes, gives no import. `code` returns the text and the imports of the names in its placeholders, grouped per path. `code.join` joins several parts. A resolver created with `isTypeOnly: true` is imported with `import type`.
