---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Describe imports and exports with language-agnostic `names`, where a name without a `space` takes the space of the declaration it points to.

- Deprecates `name`, `isTypeOnly`, `isNameSpace` and `asAlias` until v6. They still print the same output.

```diff
- <File.Import name={['Pet']} path="./models" isTypeOnly />
+ <File.Import names={[{ name: 'Pet', space: 'type' }]} path="./models" />
```
