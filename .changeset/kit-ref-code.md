---
'@kubb/kit': patch
---

Add the `ref(plugin?, options?)` composable and the `code` template. `ref` wraps a plugin's resolver, so each name member returns the name plus the import from that plugin's file. A schema name that is not in the document, or a node the plugin excludes, gives no import. `code` returns the text and the imports of the names in its holes, grouped per path. `code.join` joins several parts. A resolver created with `isTypeOnly: true` is imported with `import type`.
