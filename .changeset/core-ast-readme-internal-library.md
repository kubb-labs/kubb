---
'@kubb/core': patch
'@kubb/ast': patch
---

Frame `@kubb/core` and `@kubb/ast` as internal libraries in their READMEs. Plugin authors import from `kubb/kit`, which re-exports the authoring surface of both packages, instead of depending on them directly.
