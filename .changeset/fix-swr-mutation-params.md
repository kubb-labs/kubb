---
"@kubb/plugin-swr": patch
---

Fix SWR mutation hooks to allow passing parameters via `trigger()` instead of requiring them upfront.

Previously, SWR mutation hooks required path params, query params, and headers as function arguments when calling the hook:

```typescript
// Old behavior - parameters required upfront
const { trigger } = useDeletePet(petId, params, headers)
trigger()  // No way to pass params here
```

Now the hooks follow the same pattern as React Query mutations, where parameters are passed when triggering:

```typescript
// New behavior - parameters passed via trigger
const { trigger } = useDeletePet()
trigger({ petId, data, params, headers })  // Pass all params when triggering
```

This is a breaking change for existing code that uses SWR mutation hooks with path params or other parameters. Update your code to pass parameters to `trigger()` instead of the hook function.
