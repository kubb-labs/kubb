---
'@kubb/kit': patch
---

Add `from`, `provide` and `code`, so a generator imports another plugin's names without looking up its files.

- `from(source?)`, also `ctx.from(source)` in generators, wraps a plugin's resolver as `from(source).resolver`. Each method that returns a name returns a `RefName`: the name plus its import from that plugin's file. A schema name that is not in the document, a node the plugin excludes, or a result that is not an identifier gives `import: null`. Without `source`, it reads the current plugin, and `ctx.from()` is typed with that plugin's resolver. A `source` that no plugin provides and no plugin in the config has reports `KUBB_PLUGIN_NOT_FOUND`.
- `from(source).ref(node, name)` imports any name from the plugin's file for `node`.
- `provide(name, factory, { priority })`, also `kubb.provide` on the setup context, offers a resolver under a shared name such as `'types'`. `from(name)` and `getResolver(name)` read the provider with the highest priority, and kit calls its `factory` once per build. Type each name in `Kubb.ProvideRegistry`. A name that a plugin in the config uses is refused.
- `getResolver(name)` is typed by `Kubb.PluginRegistry` and `Kubb.ProvideRegistry`, like `ctx.getResolver`.
- A resolver's `file.name(node, exportName?)` names the files it writes. `file()` and `from()` both read it, so callers pass only the node.
- `resolveName({ key, name, scope: 'file' })` dedupes file names apart from identifiers.
- `code` is a template tag that returns the text and the imports of the names in its placeholders. `code.join(parts, separator)` joins several parts.
