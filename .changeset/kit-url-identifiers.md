---
'@kubb/kit': patch
---

`Url.toGroupedTemplateString` uses dot access for path parameters named like reserved words.

```typescript
// Before
`${path["class"]}`

// After
`${path.class}`
```
