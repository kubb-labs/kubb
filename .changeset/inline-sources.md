---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
---

Add inline sources. A source marked `inline: { expression }` (`<File.Source inline={{ expression: 'Pet' }}>`) is absorbed by the files that import it instead of being imported. A file whose sources are all inline is not written: before barrels are built, Kubb replaces each name another file imports from it with the expression, in parentheses unless it is a plain name such as `Pet`, and moves over the imports that expression needs.

```tsx
<File.Source name="AddPetStatus200" isTypeOnly isExportable inline={{ expression: 'Pet' }}>
  {`export type AddPetStatus200 = Pet`}
</File.Source>
```

A name that cannot be inlined reports `KUBB_INLINE_FAILED`. `@kubb/ast` exports the pass as `inlineFiles` and `isVirtualFile`, and the node kind discriminants as `nodeKinds`. `FileManager` gains `delete`.
