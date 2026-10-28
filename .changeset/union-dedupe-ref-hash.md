---
'@kubb/kit': patch
---

Speed up `macroSimplifyUnion` on specs whose unions reference large components, with the same output. A union member that is a `$ref` is now compared by its pointer instead of by its whole resolved schema, so a spec such as Stripe's generates in about half the time.
