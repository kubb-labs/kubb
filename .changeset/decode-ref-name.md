---
"@kubb/ast": patch
---

A `$ref` to a component whose name contains `/` or `~` now resolves to the same name as the component. The last segment of the pointer is decoded the way the resolver does it: percent-escapes first, then `~1` and `~0` (RFC 6901). Before, `#/components/schemas/a~1b~0c` imported `A1B0C` from a file that was never emitted, because the component itself is `a/b~c` and is emitted as `ABc`.
