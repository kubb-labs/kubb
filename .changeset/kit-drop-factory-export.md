---
'@kubb/kit': major
---

Remove the bare `factory` export from `kubb/kit`. Build nodes through `ast.factory` instead.

```diff
- import { factory } from 'kubb/kit'
- factory.createFile(...)
+ import { ast } from 'kubb/kit'
+ ast.factory.createFile(...)
```
