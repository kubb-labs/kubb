---
"unplugin-kubb": patch
---

The astro integration returns a typed integration object instead of `any`. This is part of a wider type-safety pass across the core packages that removes `any` and reduces cast assertions, with oxlint now enforcing `no-explicit-any` and `consistent-type-assertions`.
