---
'@kubb/plugin-zod': patch
---

Skip coercion for email, url, uuid with Zod 4. In Zod 4, coerce does not support `z.uuid()`, `z.email()` or `z.url()` and coercion does not make sense with these specific string subtypes. You could coerce a number to string, but you can't coerce a non-string to a valid uuid, url or email.
