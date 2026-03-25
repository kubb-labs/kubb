---
"@kubb/plugin-ts": minor
---

Add `enumTypeSuffix` option to control the suffix appended to the generated type alias when `enumType` is `asConst` or `asPascalConst`.

Previously, the type alias was always suffixed with `Key` (e.g. `PetTypeKey`). With `enumTypeSuffix` you can change or remove that suffix:

```typescript
pluginTs({
  enumType: 'asConst',
  enumTypeSuffix: 'Value', // → export type PetTypeValue = …
})
```

Set `enumTypeSuffix: ''` to suppress the suffix entirely and use only the base type name.

Defaults to `'Key'` for full backwards compatibility.
