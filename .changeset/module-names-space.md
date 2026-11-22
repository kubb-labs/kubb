---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
---

Describe imports and exports as language-agnostic `names`, and let a name without a `space` take the one of the declaration it points to.

- Adds `names` to `ImportNode`, `ExportNode`, `File.Import` and `File.Export`: each name is `{ name, alias?, space? }`, with `'default'` for a default export and `'*'` for the whole module.
- Adds `space: 'type' | 'value'` to `SourceNode` and `Code`. A source whose first node is a `Type` is a type.
- Fills in a missing `space` before a file is printed, from the declaration in the generated files, and warns about names it cannot find, such as names from a package.
- Adds `ast.file.getNames`, `ast.file.getSpace` and `ast.file.resolveSpaces`.
- Deprecates `name`, `isTypeOnly`, `isNameSpace` and `asAlias` on imports and exports, and `isTypeOnly` on sources, until v6. They still work and print the same output.

```diff
- <File.Import name={['Pet']} path="./models" isTypeOnly />
+ <File.Import names={[{ name: 'Pet', space: 'type' }]} path="./models" />

- <File.Import name="z" path="zod" isNameSpace />
+ <File.Import names={[{ name: '*', alias: 'z', space: 'value' }]} path="zod" />
```
