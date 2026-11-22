---
'@kubb/kit': patch
---

Add `from`, `provide` and `code`, so a generator imports another plugin's names without looking up its files.

- `from(source?)`, also `ctx.from(source)` in generators:
  - `from(source).resolver` wraps a plugin's resolver. Each method that returns a name returns a `RefName`: the name plus its import from that plugin's file.
  - `from(source).ref(node, name)` imports any name from the plugin's file for `node`.
  - Without `source`, it reads the current plugin. `ctx.from()` is typed with that plugin's resolver.
  - A name gets no import for a schema that is not in the document, a node the plugin excludes, or a result that is not an identifier.
  - An unknown `source` reports `KUBB_PLUGIN_NOT_FOUND`.
- `provide(name, factory, { priority })`, also `kubb.provide` in setup:
  - Offers a resolver under a shared name, such as `'types'`. Type each name in `Kubb.ProvideRegistry`.
  - `from(name)` and `getResolver(name)` read the provider with the highest priority.
  - Kit calls `factory` once per build.
  - A name that a plugin in the config uses is refused.
- `code` is a template tag that returns the text and the imports of the names in its placeholders. `code.join(parts, separator)` joins several parts.
- `getResolver(name)` is typed by `Kubb.PluginRegistry` and `Kubb.ProvideRegistry`, like `ctx.getResolver`.
- A resolver's `file.name(node, exportName?)` names the files it writes. `file()` and `from()` both read it, so callers pass only the node.
- `resolveName({ key, name, scope: 'file' })` dedupes file names apart from identifiers.
