---
'@kubb/kit': minor
'@kubb/core': minor
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
---

Add `this.memo(key, compute)` to every resolver, one cache per plugin per build, and `ctx.memo` plus the `memo()` composable, one cache per build shared by every plugin. Register a key prefix and its value type in `Kubb.MemoRegistry` to type the value. Export `camelCase` and `pascalCase` from `@kubb/kit` and `@kubb/core`, so a plugin computes each name once per build. Keep the results of `Resolver.resolveName` keys, `ast.refName`, and the TypeScript parser's relative import paths, and dedent text nodes in one pass. Generated output is unchanged; a large spec generates about 10% faster.
