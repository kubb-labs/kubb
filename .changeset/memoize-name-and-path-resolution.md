---
'@kubb/kit': minor
'@kubb/core': minor
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
---

Export `camelCase` and `pascalCase` from `@kubb/kit` and `@kubb/core` with a memo that lasts the whole build instead of a 10,000 entry cache that wiped itself on large specs. Keep the results of `Resolver.resolveName` keys, `ast.refName`, and the TypeScript parser's relative import paths, and dedent text nodes in one pass. Generated output is unchanged; a large spec generates about 5% faster.
