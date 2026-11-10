---
'@kubb/adapter-oas': patch
---

Leave array and primitive members of a discriminated `oneOf`/`anyOf` without the discriminant intersection. Only an object can carry the discriminator property, so `ContentDirectory & { type: 'array' }` matched no value and Zod rejected every directory listing.
