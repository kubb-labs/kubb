---
'@kubb/kit': patch
---

`Url.toGroupedTemplateString` uses dot access for path parameters named like reserved words.

```typescript
// Before
const before = `/pets/${path['class']}`

// After
const after = `/pets/${path.class}`
```
