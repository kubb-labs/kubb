---
'@kubb/ast': patch
---

Remove unused JS-string and codegen helpers from `@kubb/ast`.

`jsStringEscape`, `stringify`, `stringifyObject`, `toRegExpString`, `trimQuotes`, `getNestedAccessor`, `buildJSDoc`, `buildList`, `buildObject`, `lazyGetter`, `objectKey`, and the `isValidVarName` re-export were exported from the public barrel but nothing in the kubb or plugins ecosystem imported them through `@kubb/ast`, the plugin packages maintain their own equivalents in `@internals/utils`. Runtime behavior is unchanged.
