---
"@kubb/ast": minor
---

Add a `@kubb/ast/utils` subpath with spec-agnostic codegen helpers so plugins can share one
implementation instead of keeping local copies: `stringify`, `trimQuotes`, `jsStringEscape`,
`toRegExpString`, `stringifyObject`, `getNestedAccessor`, and `buildJSDoc`, plus `isValidVarName` and
a new `ensureValidVarName` for sanitizing generated identifiers. These stay off the main `@kubb/ast`
barrel so consumers can import them without pulling in the AST node tree.
