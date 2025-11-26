---
"@kubb/plugin-zod": patch
---

When coercion: true is enabled, the plugin generated invalid Zod syntax z.coerce.uuid(), z.coerce.email(), and z.coerce.url() which don't exist. Coercion in Zod only works with primitives (string, number, date, boolean).
