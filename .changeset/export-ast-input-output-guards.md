---
'@kubb/ast': minor
---

Export the `isInputNode` and `isOutputNode` type guards from the `@kubb/ast` entry point. Both guards were defined and documented in `guards.ts` but missing from the barrel, so they could not be imported alongside `isOperationNode` and `isSchemaNode`.
