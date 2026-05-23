---
"@kubb/ast": patch
---

Keep a default import when a used named import from the same module path is retained.

Previously, when operations were grouped into a single file, a used default import (such as a generated `client` runtime) could be dropped during the merge because its binding was not found in the reconstructed source string, producing references to an undefined value. `combineImports` now retains a default import whenever a used named/type import from the same path survives.
