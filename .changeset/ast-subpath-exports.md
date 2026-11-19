---
'@kubb/ast': minor
---

Import each `ast.*` namespace from its own path, so a package can extend a namespace and keep its types.

- Adds `@kubb/ast/factory`, `/file`, `/graph`, `/http`, `/json`, `/macro`, `/mediaType`, `/node`, `/ref` and `/schema`, each the same as `ast.<name>`.

```ts
// http.ts: everything from ast.http, plus one local helper
export * from '@kubb/ast/http'
export { getRetryAfter } from './retryAfter.ts'
```
