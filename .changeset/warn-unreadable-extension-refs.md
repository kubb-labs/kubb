---
"@kubb/adapter-oas": patch
---

Report a `$ref` that Kubb cannot read inside an `x-` vendor extension as a `KUBB_REF_NOT_FOUND` warning instead of an error. Kubb never reads extensions, so such a ref cannot change the output, and a spec like Spotify's no longer fails generation over it.
