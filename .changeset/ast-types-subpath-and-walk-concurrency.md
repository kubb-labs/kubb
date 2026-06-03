---
'@kubb/ast': patch
---

Ship the documented `@kubb/ast/types` subpath and make `walk()` traverse concurrently.

`@kubb/ast/types` is now a real export, so the README's `import type { Node } from '@kubb/ast/types'` resolves instead of failing. Consumers can pull in node interfaces and visitor types without loading any runtime.

`walk()` now visits sibling nodes concurrently up to its `concurrency` limit. Previously each child was awaited one at a time, so the documented `concurrency` option had no effect and async visitor callbacks always ran serially.
