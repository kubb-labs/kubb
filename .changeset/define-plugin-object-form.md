---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/parser-ts': minor
'@kubb/parser-md': minor
---

Add `meta`, `dependencies` records, and `setup` to plugins and parsers, and an object form for `definePlugin` and `defineParser`. The factory form still works and is now `@deprecated`. It will be removed in the next major.

```ts
export const pluginZod = definePlugin<PluginZod>({
  meta: { name: 'plugin-zod', version: '5.7.0', compatibility: { kubb: '>=5.7.0' } },
  dependencies: { 'plugin-ts': { version: '>=5.0.0' } },
  setup(options, kubb) {
    kubb.addGenerator(zodGenerator)
    return { ...options, inferred: options.inferred ?? false }
  },
})
```

- `setup(options, kubb)` runs before `kubb:plugin:setup`. Its return value becomes the plugin's resolved options. `plugin.options` keeps the raw user options.
- `meta.compatibility` sets semver ranges for Kubb and Node.js. A mismatch fails the run with `KUBB_INCOMPATIBLE_EXTENSION`.
- `dependencies` takes a record, or a function that returns one from the user's options. A missing required entry fails with `KUBB_MISSING_DEPENDENCY`. A `version` range the dependency's `meta.version` does not satisfy fails with `KUBB_INCOMPATIBLE_DEPENDENCY`. With `optional: true`, a missing entry is skipped, but an installed one still has its version checked. An array still only orders plugins.
- `defineParser` takes the same kind of object: `meta`, plus `setup(options)` that returns `extNames`, `parse`, `print`, and `copy`. A parser's `meta.compatibility` is checked like a plugin's.
- Both forms return a factory with `kind` (`'plugin'` or `'parser'`). The object form's factory also carries `meta`, so tools can read it without calling the factory.
- A factory-form plugin or parser can return `meta`, a `dependencies` record, and `setup` too, which eases moving over. Without `meta`, it gets `{ name }`.
- `parserTs`, `parserTsx`, and `parserMd` use the object form.
- `PluginType<TName, TOptions, TResolvedOptions, TResolver>` types the definition. It is the same shape as `PluginFactoryOptions`.
