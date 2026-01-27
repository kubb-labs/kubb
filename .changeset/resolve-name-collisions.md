---
'@kubb/oas': minor
'@kubb/plugin-oas': minor
---

Add `collisionDetection` option to intelligently handle schema name collisions

Added a new opt-in `collisionDetection` option that prevents duplicate files and naming conflicts when OpenAPI specs contain schemas with the same name (case-insensitive) across different components.

**Features:**
- **Cross-component collisions**: Automatically adds semantic suffixes (`Schema`, `Response`, `Request`) when schemas from different components share names
- **Same-component collisions**: Adds numeric suffixes (2, 3, ...) for case-insensitive duplicates within the same component
- **Smart detection**: Skips requestBodies/responses that only contain `$ref` (not inline schemas) to avoid unnecessary collisions
- **Non-breaking**: Disabled by default, preserving existing behavior for all users

**Usage:**
```typescript
// kubb.config.ts
export default defineConfig({
  plugins: [
    pluginOas({
      collisionDetection: true,  // Enable collision detection
    }),
  ],
})
```

**Example - Cross-component collision:**
```yaml
components:
  schemas:
    Order: { ... }
  requestBodies:
    Order:
      content:
        application/json:
          schema: { type: object, ... }  # Inline schema
```

**Before** (with collisions disabled):
- May generate: `Order.ts` (duplicate), `OrderSchema.ts`, `OrderRequest.ts`
- Potential import errors and duplicate files

**After** (with `collisionDetection: true`):
- Generates: `OrderSchema.ts`, `OrderRequest.ts`
- Types: `OrderSchema`, `OrderRequest`
- Operation imports correctly reference `OrderSchema`

**Example - Same-component collision:**
```yaml
components:
  schemas:
    Variant: { ... }
    variant: { ... }  # Different casing
```

**After** (with `collisionDetection: true`):
- Generates: `Variant.ts`, `Variant2.ts`
- Preserves original spec order for deterministic behavior

This change stores the option in the Oas instance (`oas.options.collisionDetection`), making it accessible throughout the generation pipeline without passing it through multiple layers.
