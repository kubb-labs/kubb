---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
---

`inline` moves to the file. `<File inline>` marks a file that is never written, and each file that imports from it gets the body of each `Const` or `Type` it imports. A `Function`, or printed `Code` text, has no such body, so importing one reports a problem. `inline` on `Const`, `Type` and `Function`, and `SourceNode.inline`, are deprecated until Kubb v6.

```diff
- <File baseName="AddPet.ts" path={path}>
-   <Type export name="AddPetStatus200" inline>{'Pet'}</Type>
- </File>
+ <File baseName="AddPet.ts" path={path} inline>
+   <Type export name="AddPetStatus200">{'Pet'}</Type>
+ </File>
```
