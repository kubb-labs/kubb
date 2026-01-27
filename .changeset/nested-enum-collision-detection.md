---
'@kubb/plugin-oas': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-zod': patch
---

Enhanced `collisionDetection` to prevent nested enum name collisions across different schemas

When `collisionDetection: true` is enabled, Kubb now prevents duplicate enum names that occur when multiple schemas define identical inline enums in nested properties.

**New behavior:**
- Tracks root schema name throughout parsing chain
- Includes root schema name in enum naming for nested properties
- Only applies when `collisionDetection: true` (backward compatible)

**Example:**
```yaml
components:
  schemas:
    NotificationTypeA:
      properties:
        params:
          properties:
            channel:
              type: string
              enum: [public, collaborators]
    
    NotificationTypeB:
      properties:
        params:
          properties:
            channel:
              type: string
              enum: [public, collaborators]
```

**Before** (without this fix):
```typescript
// Both files export the same enum name - collision!
export const paramsChannelEnum = { ... }
```

**After** (with `collisionDetection: true`):
```typescript
// NotificationTypeA.ts
export const notificationTypeAParamsChannelEnum = { ... }

// NotificationTypeB.ts
export const notificationTypeBParamsChannelEnum = { ... }
```

**Deprecated:**
- Marked `usedEnumNames` as deprecated - will be removed in v5 when `collisionDetection` defaults to `true`
- The rootName-based approach eliminates the need for numeric suffix fallbacks

**Migration:**
Enable `collisionDetection: true` in your configuration to benefit from this enhancement and prepare for v5:

```typescript
pluginOas({
  collisionDetection: true, // Recommended - prevents all collision types
})
```
