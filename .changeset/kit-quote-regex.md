---
'@kubb/kit': patch
---

Make `text.quote` about 13 times faster, with the same output. Plugins call it for every default, enum value and object key, so a build of types, Zod schemas and a client from the 45 MB Microsoft Graph spec drops from about 131 s to 55 s.
