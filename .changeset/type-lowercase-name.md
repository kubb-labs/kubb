---
'@kubb/renderer-jsx': patch
---

`Type` accepts a name that starts with a lowercase letter, such as `pet_owner` from a resolver that keeps the spec's schema keys. It threw `Name should start with a capital letter` before.
