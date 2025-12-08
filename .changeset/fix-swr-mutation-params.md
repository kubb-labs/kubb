---
"@kubb/plugin-swr": patch
---

Add new `paramsToTrigger` option for SWR mutations.

When `mutation.paramsToTrigger` is set to `true`, mutation parameters (path params, query params, headers, request body) are passed via `trigger()` instead of as hook arguments:

```typescript
// With paramsToTrigger: true
const { trigger } = useDeletePet()
trigger({ petId, data, params, headers })
```

This aligns with React Query's mutation pattern. The default behavior remains unchanged for backward compatibility.

**Note:** `paramsToTrigger: true` will become the default in v5. Set it now to opt-in early.
