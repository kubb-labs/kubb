---
"@kubb/plugin-ts": patch
---

Fix `asConst`/`asPascalConst` enums emitting `#`-prefixed values (e.g. hex colours like `#ccff9a`) as unquoted object keys.

`isValidIdentifier` accepted `#`-prefixed names because `ts.parseIsolatedEntityName` parses them as private identifiers. Private identifiers are only valid inside a class body, so using one as an object/property key produced invalid output (`TS18016: Private identifiers are not allowed outside class bodies`). `#`-prefixed names are now treated as non-identifiers and quoted.
