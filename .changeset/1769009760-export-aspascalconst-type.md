---
"@kubb/plugin-ts": patch
---

Fix export of type alias for `asPascalConst` enums

When using `enumType: 'asPascalConst'`, the generated type alias is now properly exported. This allows consuming code to import and use the type.
