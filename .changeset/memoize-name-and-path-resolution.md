---
'@kubb/kit': minor
'@kubb/core': minor
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
---

Give every resolver `this.memo(key, compute)`, a cache that lives for one build, and export `camelCase` and `pascalCase` from `@kubb/kit` and `@kubb/core`, so a plugin computes each name once per build. Keep the results of `Resolver.resolveName` keys, `ast.refName`, and the TypeScript parser's relative import paths, and dedent text nodes in one pass. Generated output is unchanged; a large spec generates about 10% faster.
