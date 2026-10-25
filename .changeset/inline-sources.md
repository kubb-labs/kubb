---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/renderer-jsx': minor
---

Add inline sources. Files that import a source marked `inline: { expression }` get the expression in place of the name, and a file whose sources are all inline is not written. The parser for the file's extension supplies the language rules through the new `inline` member, which `parserTs` implements.

```tsx
<File.Source name="AddPetStatus200" isTypeOnly isExportable inline={{ expression: 'Pet' }}>
  {`export type AddPetStatus200 = Pet`}
</File.Source>
```
