---
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/plugin-ts": minor
---

- Improved discriminator handling — named and inline enum variants are now generated correctly for discriminator properties.
- Better support for string-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) so they are consistently emitted as plain strings when expected.
- Operation paths are now available in Express-style format (e.g. `/pets/:petId`) making it easier to use them directly in route definitions.
