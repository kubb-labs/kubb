---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Add Express-style operation paths and improve type handling.

- Operation paths are now available in Express format (e.g. `/pets/:petId`) for direct use in route definitions
- Improved discriminator handling for named and inline enum variants
- String-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) are consistently emitted as plain strings
