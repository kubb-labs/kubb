---
'@kubb/plugin-ts': patch
---

Suppress redundant `*Enum` type alias for `asConst` enums in legacy mode. Previously, v5 exported an extra `export type FooEnum = FooEnumKey` alias that v4 did not have. The alias is now only emitted in non-legacy mode.
