---
'@kubb/kit': patch
---

Add `from`, `provide` and `code`, so a generator imports another plugin's names without looking up its files.

- `from(source?)`, also `ctx.from(source)`, wraps a plugin's resolver so each name it returns comes with its import. `from(source).ref(node, name)` imports any other name.
- `provide(name, factory, { priority })` offers a resolver under a shared name such as `'types'`, typed in `Kubb.ProvideRegistry`. The highest priority wins.
- `code` is a template tag that returns the text and the imports of the names in it. `code.join(parts, separator)` joins parts.
- A resolver's `file.name(node)` names the files it writes, and `resolveName({ scope: 'file' })` dedupes them apart from identifiers.
- `getResolver(name)` is typed by plugin or provided name.

```tsx
const types = ctx.from('plugin-ts').resolver
const source = code`export const petSchema = z.object({}) satisfies z.ZodType<${types.name('Pet')}>`
```
