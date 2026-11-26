---
'@kubb/ast': patch
---

When `inlineFiles` moves an inlined type's imports into the importing file, an import whose name that file already uses for something else now gets an alias. A schema named `Options` inlined into a client that imports the runtime `Options` becomes `import type { Options as Options2 } from '../types/Options'`, and the inlined type uses `Options2`. Before, the file declared `Options` twice and failed to type-check.
