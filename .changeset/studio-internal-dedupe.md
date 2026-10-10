---
'@kubb/studio': patch
---

Internal cleanup of `@kubb/studio`. A config edit whose value is a class instance, such as a `Date`, is now refused as not a literal, matching the protocol's `OptionValue` type.
