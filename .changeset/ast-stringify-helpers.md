---
"@kubb/ast": major
---

Add a `@kubb/ast/utils` subpath for spec-agnostic helpers that produce or format generated source,
so the main `@kubb/ast` barrel stays focused on the AST node tree and every adapter can share one
implementation. The subpath exports `stringify`, `trimQuotes`, `jsStringEscape`, `toRegExpString`,
`stringifyObject`, `getNestedAccessor`, `buildJSDoc`, `isValidVarName`, and a new `ensureValidVarName`.

It also moves the pure (non-node) helpers `objectKey`, `buildObject`, `buildList`, `childName`,
`enumPropName`, `extractRefName`, and `findDiscriminator` from the main barrel to `@kubb/ast/utils`.
This is breaking: import them from `@kubb/ast/utils` instead of `@kubb/ast` (they are also no longer
part of the `ast` namespace re-exported by `@kubb/core`).
