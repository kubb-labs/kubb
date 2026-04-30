---
"@kubb/plugin-faker": patch
---

Fix infinite recursion for mutually recursive schemas in `plugin-faker`.

**Issue**: Schemas with mutual references (e.g. `Cat → Pet → Dog → Pet`) caused a call-stack overflow at runtime because faker factory functions eagerly called each other in a cycle.

**Fixed**: Cyclic properties are now emitted as JavaScript getter properties. The outer object spread (`{ ...inner }`) still materialises all getters, so faker's deterministic seed behaviour is preserved by default.

To break the cycle, pass the cyclic property via the `data` argument. The inner `...(data || {})` overwrites the getter before the outer spread evaluates it:

```typescript
// Generated output
export function cat(data?: Partial<Cat>): Cat {
  return {
    ...{
      id: faker.number.int(),
      __typename: faker.helpers.arrayElement<NonNullable<Cat>['__typename']>(['Cat']),
      get archEnemy() {
        return pet() // evaluated by the outer spread unless overridden
      },
      ...(data || {}), // overrides the getter when data.archEnemy is provided
    },
  }
}

// Default — getter is evaluated, full deterministic output
cat()

// Break the cycle manually by supplying the cyclic property
cat({ archEnemy: undefined })
```
