---
'@kubb/kit': minor
'@kubb/core': minor
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
---

Give every resolver `this.camelCase` and `this.pascalCase`, one memo per `createKubb` shared by all plugins, instead of a 10,000 entry cache per plugin bundle that wiped itself on large specs. `camelCase` and `pascalCase` from `@kubb/kit` and `@kubb/core` are the plain helpers. Keep the results of `Resolver.resolveName` keys, `ast.refName`, and the TypeScript parser's relative import paths, and dedent text nodes in one pass. Generated output is unchanged; a large spec generates about 5% faster.
