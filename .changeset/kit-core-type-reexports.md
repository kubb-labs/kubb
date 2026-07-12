---
"@kubb/kit": minor
---

Re-export the `Hookable` class from `@kubb/kit` (and so from the `kubb/kit` subpath), alongside the `Diagnostics`, `fsStorage`, and `memoryStorage` values already there. Code building on the kit no longer has to reach into `@kubb/core` for the hook emitter.
