---
'@kubb/kit': patch
---

Add the `ref(plugin?)` composable and the `code` template. `ref` wraps a plugin's resolver, so each name member returns the name plus the import from that plugin's file. `code` returns the text and the imports of the names in its holes, grouped per path. `code.join` joins several parts. A resolver created with `isTypeOnly: true` is imported with `import type`.
