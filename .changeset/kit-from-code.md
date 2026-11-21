---
'@kubb/kit': patch
---

Add the `from(plugin?, options?)` composable and the `code` template. `from(plugin).resolver` wraps a plugin's resolver, so each resolver method that returns a name returns the name plus its import from that plugin's file. A schema name that is not in the document, or a node the plugin excludes, gives no import. `from(plugin).has(node)` tells whether the plugin generates `node`. `from(plugin).file(node).name(name)` imports any name from the plugin's file for `node`. `provide(name, factory, { priority })` offers a resolver under a capability name, such as `'types'`, and `from(name)` reads the provider with the highest priority. `code` returns the text and the imports of the names in its placeholders, grouped per path. `code.join` joins several parts. A resolver created with `isTypeOnly: true` is imported with `import type`.
