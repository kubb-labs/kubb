---
'@kubb/adapter-oas': patch
---

Keep every `pattern` of an `allOf`, so the value must match all of them.

```diff
- value: z.string().regex(/^[a-z]*$/)
+ value: z.string().regex(/^[a-z]*$/).regex(/^[^q]*$/)
```
