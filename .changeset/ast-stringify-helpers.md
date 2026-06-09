---
"@kubb/ast": minor
---

Add string-literal and codegen formatting helpers to the public API so plugins can share one
implementation instead of keeping local copies: `stringify`, `trimQuotes`, `jsStringEscape`,
`toRegExpString`, `stringifyObject`, `getNestedAccessor`, and `buildJSDoc`. `isValidVarName` and the
new `ensureValidVarName` are now exported too for sanitizing generated identifiers.
