---
'@kubb/core': patch
'@kubb/kit': patch
---

Make resolver parts reusable across plugins. `defineResolver` types a partial resolver, `setResolver` accepts a list of parts merged left to right, and `@kubb/kit` exports the shared parts `resolverOperationParams`, `resolverOperationResponse`, and `resolverCasedFile`, plus `operationKey`. `toFilePath` takes an optional `caseLast` for the file name.
