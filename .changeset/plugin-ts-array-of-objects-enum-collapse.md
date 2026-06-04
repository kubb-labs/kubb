---
"@kubb/plugin-ts": patch
---

Fix `enumType: 'asConst'`/`'asPascalConst'` collapsing an array of objects into a bare enum array when the array's object items contain an enum property.

`isDirectEnum` previously matched *any* array that had `items`, so a schema like:

```yaml
type: array
items:
  type: object
  properties:
    id: { type: integer }
    status: { type: string, enum: [active, inactive] }
```

was emitted as `StatusEnumKey[]` — the object shape (`id`, `status`) was discarded in favour of the first nested enum. It is now only treated as a direct enum array when the array's `items` are themselves an enum, so the object type is preserved (`{ id: number; status: StatusEnumKey }[]`).
