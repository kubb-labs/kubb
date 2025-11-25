---
'@kubb/plugin-zod': patch
---

Fix Zod v4 uuid/url/email generation with coercion enabled. When coercion is true and version is set to '4', the plugin now correctly generates v4 syntax (e.g., `z.coerce.uuid()`) instead of v3 syntax (e.g., `z.coerce.string().uuid()`).
